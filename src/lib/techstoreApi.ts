import { API_BASE_URL } from '../data/apiContract'
import type { ChartPoint, ForecastItem, ListItem, MetricCard } from '../data/dashboardMocks'

type JsonRecord = Record<string, unknown>

export type LoginResponse = {
  access_token: string
  token_type: string
}

const numberKeys = [
  'ingresos',
  'monto',
  'total',
  'ventas',
  'units',
  'unidades',
  'cantidad',
  'stock',
  'ticket',
  'price',
  'precio',
  'valor',
  'amount',
]

const labelKeys = [
  'nombre',
  'name',
  'categoria',
  'category',
  'sucursal',
  'branch',
  'cliente',
  'client',
  'producto',
  'product',
  'mes',
  'month',
  'periodo',
  'period',
]

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function arrayFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return []

  const arrayKeys = ['data', 'items', 'results', 'rows', 'ventas', 'productos', 'clientes', 'sucursales', 'recomendaciones', 'predicciones']
  for (const key of arrayKeys) {
    const value = payload[key]
    if (Array.isArray(value)) return value
  }

  return []
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toLabel(record: JsonRecord, fallback: string): string {
  for (const key of labelKeys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return fallback
}

function toValue(record: JsonRecord): number {
  for (const key of numberKeys) {
    const value = toNumber(record[key])
    if (value !== null) return value
  }

  for (const value of Object.values(record)) {
    const parsed = toNumber(value)
    if (parsed !== null) return parsed
  }

  return 0
}

function previewRecord(record: JsonRecord): string {
  const entries = Object.entries(record)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)

  return entries.join(' · ')
}

export async function fetchTechStoreJson(path: string, token?: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function loginToTechStore(username: string, password: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function parseLoginResponse(payload: unknown): LoginResponse | null {
  if (!isRecord(payload)) return null

  const accessToken = payload.access_token
  const tokenType = payload.token_type

  if (typeof accessToken !== 'string' || !accessToken.trim()) return null
  if (typeof tokenType !== 'string' || tokenType.trim().toLowerCase() !== 'bearer') return null

  return {
    access_token: accessToken.trim(),
    token_type: tokenType.trim(),
  }
}

export function extractBearerToken(payload: unknown): string | null {
  const loginResponse = parseLoginResponse(payload)
  if (loginResponse) {
    return loginResponse.access_token
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim()
  }

  if (!isRecord(payload)) return null

  const tokenKeys = ['accessToken', 'token', 'bearer', 'jwt']
  for (const key of tokenKeys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  for (const value of Object.values(payload)) {
    if (typeof value === 'string' && value.startsWith('eyJ')) {
      return value
    }
  }

  return null
}

export function metricCardsFromPayload(payload: unknown): MetricCard[] {
  if (!isRecord(payload)) return []

  const numericEntries = Object.entries(payload).filter(([, value]) => toNumber(value) !== null)
  if (!numericEntries.length) return []

  return numericEntries.slice(0, 4).map(([key, value], index) => ({
    label: key,
    value: new Intl.NumberFormat('es-MX', {
      maximumFractionDigits: 0,
    }).format(toNumber(value) ?? 0),
    delta: index === 0 ? 'live' : 'sync',
    tone: ['cyan', 'lime', 'amber', 'violet'][index % 4] as MetricCard['tone'],
  }))
}

export function chartPointsFromPayload(payload: unknown, fallbackPrefix: string): ChartPoint[] {
  const rows = arrayFromPayload(payload)
  if (!rows.length) return []

  return rows.slice(0, 8).map((item, index) => {
    if (!isRecord(item)) {
      return { name: `${fallbackPrefix} ${index + 1}`, value: toNumber(item) ?? index + 1 }
    }

    return {
      name: toLabel(item, `${fallbackPrefix} ${index + 1}`),
      value: toValue(item),
    }
  })
}

export function listItemsFromPayload(payload: unknown, fallbackPrefix: string): ListItem[] {
  const rows = arrayFromPayload(payload)
  if (!rows.length) return []

  return rows.slice(0, 5).map((item, index) => {
    if (!isRecord(item)) {
      return {
        title: `${fallbackPrefix} ${index + 1}`,
        detail: String(item),
        accent: 'live',
      }
    }

    return {
      title: toLabel(item, `${fallbackPrefix} ${index + 1}`),
      detail: previewRecord(item),
      accent: String(toValue(item) || 'live'),
    }
  })
}

export function forecastFromPayload(payload: unknown, fallbackPeriod: string): ForecastItem[] {
  const rows = arrayFromPayload(payload)
  if (!rows.length) return []

  return rows.slice(0, 4).map((item, index) => {
    if (!isRecord(item)) {
      return {
        period: `${fallbackPeriod} ${index + 1}`,
        revenue: String(item),
        growth: 'predicción live',
      }
    }

    return {
      period: toLabel(item, `${fallbackPeriod} ${index + 1}`),
      revenue: new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(toValue(item)),
      growth: previewRecord(item) || 'predicción live',
    }
  })
}

export function objectToSummaryRows(payload: unknown): Array<{ label: string; value: string }> {
  if (!isRecord(payload)) return []

  return Object.entries(payload)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .slice(0, 6)
    .map(([label, value]) => ({
      label,
      value: String(value),
    }))
}

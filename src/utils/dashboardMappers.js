const monthNames = {
  1: 'Ene',
  2: 'Feb',
  3: 'Mar',
  4: 'Abr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dic',
}

export function unwrapPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return payload
  return payload.data ?? payload.results ?? payload.items ?? payload.rows ?? payload
}

export function asArray(payload) {
  const unwrapped = unwrapPayload(payload)
  if (Array.isArray(unwrapped)) return unwrapped
  if (!unwrapped || typeof unwrapped !== 'object') return []

  const keys = ['ventas', 'stock', 'alertas', 'logs', 'errores', 'reclamos', 'clientes', 'productos', 'items', 'rows', 'data']
  for (const key of keys) {
    if (Array.isArray(unwrapped[key])) return unwrapped[key]
  }
  return []
}

export function getFirstValue(record, keys, fallback = undefined) {
  if (!record || typeof record !== 'object') return fallback
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

export function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function sumBy(rows, keys) {
  return rows.reduce((total, row) => total + toNumber(getFirstValue(row, keys, 0)), 0)
}

function countUnique(rows, keys) {
  return new Set(rows.map((row) => getFirstValue(row, keys)).filter(Boolean)).size
}

export function pickOverviewSection(overview, keys, fallback = []) {
  const data = unwrapPayload(overview)
  if (!data || typeof data !== 'object') return fallback
  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object' && Array.isArray(value.data)) return value.data
  }
  return fallback
}

export function pickKpis(overview, ventas, stockBajo, alertas) {
  const data = unwrapPayload(overview)
  const kpis = data?.kpis || data?.resumen || data?.metricas || data || {}
  const totalVentas = getFirstValue(kpis, ['total_ventas', 'ventas_totales', 'ingresos', 'total'], sumBy(ventas, ['total', 'subtotal', 'monto']))
  const transacciones = getFirstValue(kpis, ['pedidos', 'total_pedidos', 'transacciones', 'total_transacciones'], ventas.length)
  const unidades = getFirstValue(kpis, ['unidades_vendidas', 'unidades', 'productos_vendidos'], sumBy(ventas, ['cantidad', 'unidades']))
  const clientes = getFirstValue(kpis, ['clientes_unicos', 'total_clientes'], countUnique(ventas, ['id_cliente', 'cliente']))
  const productos = getFirstValue(kpis, ['productos_vendidos', 'productos_unicos'], countUnique(ventas, ['id_producto', 'producto']))
  const alertasActivas = getFirstValue(kpis, ['alertas_activas', 'total_alertas', 'alertas'], alertas.length)

  return {
    totalVentas: toNumber(totalVentas),
    variacionVentas: toNumber(getFirstValue(kpis, ['variacion_ventas', 'variacion_ventas_pct', 'crecimiento_pct'], 0)),
    transacciones: toNumber(transacciones),
    ticketPromedio: toNumber(getFirstValue(kpis, ['ticket_promedio'], toNumber(totalVentas) / Math.max(toNumber(transacciones), 1))),
    unidadesVendidas: toNumber(unidades),
    clientesUnicos: toNumber(clientes),
    productosVendidos: toNumber(productos),
    alertasActivas: toNumber(alertasActivas || stockBajo.length),
  }
}

export function groupRows(rows, labelKeys, valueKeys, limit = 8) {
  const grouped = new Map()
  rows.forEach((row) => {
    const label = String(getFirstValue(row, labelKeys, 'Sin clasificar'))
    const current = grouped.get(label) || 0
    grouped.set(label, current + toNumber(getFirstValue(row, valueKeys, 0)))
  })
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function normalizeMonthly(rows, valueKeys = ['total_ventas', 'monto', 'total'], options = {}) {
  const years = new Set(rows.map((row) => getFirstValue(row, ['anio', 'year'])).filter(Boolean))
  const shouldShowYear = options.includeYear || years.size > 1

  return [...rows].sort((a, b) => {
    const yearA = toNumber(getFirstValue(a, ['anio', 'year'], 0))
    const yearB = toNumber(getFirstValue(b, ['anio', 'year'], 0))
    const monthA = toNumber(getFirstValue(a, ['mes_numero', 'mes', 'month'], 0))
    const monthB = toNumber(getFirstValue(b, ['mes_numero', 'mes', 'month'], 0))
    return yearA === yearB ? monthA - monthB : yearA - yearB
  }).map((row) => {
    const rawMonth = getFirstValue(row, ['nombre_mes', 'mes_nombre', 'mes', 'month', 'periodo'], 'Sin mes')
    const year = getFirstValue(row, ['anio', 'year'])
    const baseName = monthNames[rawMonth] || String(rawMonth).slice(0, 12)
    const name = year && shouldShowYear ? `${baseName} ${year}` : baseName

    return {
      name,
      year,
      value: toNumber(getFirstValue(row, valueKeys, 0)),
    }
  })
}

export function normalizeTableRows(payload) {
  return asArray(payload)
}

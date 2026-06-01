import axios from 'axios'
import { buildQueryParams } from '../utils/buildQueryParams'

const rawBaseUrl = import.meta.env.VITE_API_URL || '/api'
const API_BASE_URL = rawBaseUrl.replace(/\/$/, '')

function resolvePath(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return normalizedPath.replace('/api', '')
  }
  if (!API_BASE_URL.endsWith('/api') && !normalizedPath.startsWith('/api/')) {
    return `/api${normalizedPath}`
  }
  return normalizedPath
}

function getAuthToken() {
  return localStorage.getItem('techstore.token') || localStorage.getItem('token') || ''
}

function clearUnauthorizedSession() {
  localStorage.removeItem('techstore.token')
  localStorage.removeItem('token')
  window.dispatchEvent(new Event('techstore:unauthorized'))
}

export function getHttpErrorMessage(error) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Error inesperado.'
  }

  const status = error.response?.status
  const payload = error.response?.data
  const apiMessage = payload?.message || payload?.error || payload?.detail

  if (Array.isArray(apiMessage)) {
    return apiMessage.map((item) => item?.msg || JSON.stringify(item)).join(', ')
  }

  if (typeof apiMessage === 'string') return apiMessage

  const messages = {
    400: 'Solicitud inválida. Revisa los filtros enviados.',
    401: 'Sesión no autorizada. Inicia sesión nuevamente.',
    403: 'No tienes permisos para consultar este recurso.',
    404: 'El recurso solicitado no existe.',
    422: 'Hay filtros con formato inválido.',
    500: 'Error interno del servidor.',
  }

  return messages[status] || `No se pudo completar la solicitud${status ? ` (${status})` : ''}.`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearUnauthorizedSession()
    }
    return Promise.reject(error)
  },
)

async function get(path, filters = {}) {
  const query = buildQueryParams(filters)
  const response = await api.get(`${resolvePath(path)}${query}`)
  return response.data
}

export const techstoreDashboardApi = {
  getFiltros: () => get('/api/filtros'),
  getFiltroVendedores: () => get('/api/filtros/vendedores'),
  searchClientes: (search = '') => get('/api/clientes', { search, limit: 12 }),
  searchProductos: (search = '') => get('/api/productos', { search, limit: 12 }),
  searchSucursales: (search = '') => get('/api/sucursales', { search, limit: 12 }),
  searchCategorias: (search = '') => get('/api/categorias', { search, limit: 12 }),
  searchVendedores: (search = '') => get('/api/vendedores', { search, limit: 12 }),
  getOverview: (filters) => get('/api/dashboard/overview', filters),
  getVentasMetodoPago: (filters) => get('/api/dashboard/ventas-metodo-pago', filters),
  getVentas: (filters) => get('/api/ventas', filters),
  getVentaDetalle: (id) => get(`/api/ventas/${id}`),
  getStock: (filters) => get('/api/stock', filters),
  getStockBajo: (filters) => get('/api/stock/bajo', filters),
  getReclamosPorCliente: (filters) => get('/api/reclamos/por-cliente', filters),
  getReclamosPorMes: (filters) => get('/api/reclamos/por-mes', filters),
  getAlertas: (filters) => get('/api/alertas', filters),
  getLogs: (filters) => get('/api/logs', filters),
  getErrores: (filters) => get('/api/errores', filters),
}

export { API_BASE_URL }

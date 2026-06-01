import axios from 'axios'
import { buildQueryParams } from '../utils/buildQueryParams'

const apiBase = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({
  baseURL: apiBase,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function getAuthToken() {
  return localStorage.getItem('techstore.token') || localStorage.getItem('token') || ''
}

function clearUnauthorizedSession() {
  localStorage.removeItem('techstore.token')
  localStorage.removeItem('token')
  window.dispatchEvent(new Event('techstore:unauthorized'))
}

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

export async function getDashboardKpis(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/dashboard/kpis${q}`)
  return res.data
}

export async function getVentasMensuales(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/dashboard/ventas-mensuales${q}`)
  return res.data
}

export async function getVentasCategoria(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/dashboard/ventas-categoria${q}`)
  return res.data
}

export async function getVentasSucursal(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/dashboard/ventas-sucursal${q}`)
  return res.data
}

export async function getVentasVendedor(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/dashboard/ventas-vendedor${q}`)
  return res.data
}

export async function getVentasMetodoPago(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/dashboard/ventas-metodo-pago${q}`)
  return res.data
}

export async function getVentas(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/ventas${q}`)
  return res.data
}

export async function getVentaById(id: string | number) {
  const res = await api.get(`/ventas/${id}`)
  return res.data
}

export async function getStock(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/stock${q}`)
  return res.data
}

export async function getLowStock(limite = 5) {
  const res = await api.get(`/stock/bajo?limite=${limite}`)
  return res.data
}

export async function getReclamos(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/reclamos${q}`)
  return res.data
}

export async function getReclamosPorCliente(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/reclamos/por-cliente${q}`)
  return res.data
}

export async function getReclamosPorMes(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/reclamos/por-mes${q}`)
  return res.data
}

export async function getClientes(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/clientes${q}`)
  return res.data
}

export async function getProductos(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/productos${q}`)
  return res.data
}

export async function getSucursales(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/sucursales${q}`)
  return res.data
}

export async function getAlertas(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/alertas${q}`)
  return res.data
}

export async function getFiltros() {
  const res = await api.get(`/filtros`)
  return res.data
}

export async function getLogs(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/logs${q}`)
  return res.data
}

export async function getErrores(filters = {}) {
  const q = buildQueryParams(filters)
  const res = await api.get(`/errores${q}`)
  return res.data
}

export default api

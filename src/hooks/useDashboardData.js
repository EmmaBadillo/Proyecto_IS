import { useCallback, useEffect, useMemo, useState } from 'react'
import { getHttpErrorMessage, techstoreDashboardApi } from '../services/techstoreDashboardApi'
import {
  asArray,
  groupRows,
  normalizeMonthly,
  pickKpis,
  pickOverviewSection,
  unwrapPayload,
} from '../utils/dashboardMappers'

const emptyDashboard = {
  overview: null,
  ventasMetodoPago: [],
  ventas: [],
  stock: [],
  stockBajo: [],
  reclamosCliente: [],
  reclamosMes: [],
  alertas: [],
  logs: [],
  errores: [],
}

function compactFilters(filters) {
  const allowed = new Set([
    'mes',
    'anio',
    'id_sucursal',
    'id_producto',
    'id_cliente',
    'id_vendedor',
    'id_metodo_pago',
    'categoria',
  ])

  return Object.fromEntries(
    Object.entries(filters || {})
      .filter(([key]) => allowed.has(key))
      .filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export function useDashboardData(filters) {
  const [data, setData] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errors, setErrors] = useState([])
  const stableFilters = useMemo(() => compactFilters(filters), [filters])
  const filtersKey = useMemo(() => JSON.stringify(stableFilters), [stableFilters])

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setErrors([])

    const requests = [
      ['overview', techstoreDashboardApi.getOverview(stableFilters)],
      ['ventasMetodoPago', techstoreDashboardApi.getVentasMetodoPago(stableFilters)],
      ['ventas', techstoreDashboardApi.getVentas(stableFilters)],
      ['stock', techstoreDashboardApi.getStock(stableFilters)],
      ['stockBajo', techstoreDashboardApi.getStockBajo(stableFilters)],
      ['reclamosCliente', techstoreDashboardApi.getReclamosPorCliente(stableFilters)],
      ['reclamosMes', techstoreDashboardApi.getReclamosPorMes(stableFilters)],
      ['alertas', techstoreDashboardApi.getAlertas(stableFilters)],
      ['logs', techstoreDashboardApi.getLogs(stableFilters)],
      ['errores', techstoreDashboardApi.getErrores(stableFilters)],
    ]

    const settled = await Promise.allSettled(requests.map(([, promise]) => promise))
    const next = { ...emptyDashboard }
    const nextErrors = []

    settled.forEach((result, index) => {
      const key = requests[index][0]
      if (result.status === 'fulfilled') {
        next[key] = key === 'overview' ? unwrapPayload(result.value) : asArray(result.value)
      } else {
        nextErrors.push({ section: key, message: getHttpErrorMessage(result.reason) })
      }
    })

    setData(next)
    setErrors(nextErrors)
    setLoading(false)
    setRefreshing(false)
  }, [filtersKey])

  useEffect(() => {
    void load()
  }, [load])

  const model = useMemo(() => {
    const monthlyFromOverview = pickOverviewSection(data.overview, ['ventas_por_mes', 'ventas_mensuales', 'monthly_sales'])
    const categoryFromOverview = pickOverviewSection(data.overview, ['ventas_por_categoria', 'categorias', 'sales_by_category'])
    const branchFromOverview = pickOverviewSection(data.overview, ['ventas_por_sucursal', 'sucursales', 'sales_by_branch'])
    const paymentFromOverview = pickOverviewSection(data.overview, ['ventas_por_metodo_pago', 'metodos_pago', 'sales_by_payment'])
    const topProductsFromOverview = pickOverviewSection(data.overview, ['top_productos', 'productos_top', 'top_products'])
    const mixFromOverview = pickOverviewSection(data.overview, ['mix_productos', 'productos_mix', 'product_mix'])

    return {
      kpis: pickKpis(data.overview, data.ventas, data.stockBajo, data.alertas),
      ventasPorMes: monthlyFromOverview.length
        ? normalizeMonthly(monthlyFromOverview, ['ventas', 'total_ventas', 'ingresos', 'monto', 'total'], { includeYear: Boolean(stableFilters.mes && !stableFilters.anio) })
        : normalizeMonthly(groupRows(data.ventas, ['nombre_mes', 'mes'], ['total', 'monto'])),
      ventasPorCategoria: categoryFromOverview.length ? groupRows(categoryFromOverview, ['categoria', 'name'], ['ingresos', 'ventas', 'total_ventas', 'total', 'monto']) : groupRows(data.ventas, ['categoria'], ['total', 'monto']),
      ventasPorSucursal: branchFromOverview.length ? groupRows(branchFromOverview, ['sucursal', 'nombre'], ['ingresos', 'ventas', 'total_ventas', 'total', 'monto']) : groupRows(data.ventas, ['sucursal'], ['total', 'monto']),
      ventasPorMetodoPago: paymentFromOverview.length
        ? groupRows(paymentFromOverview, ['metodo_pago', 'nombre'], ['ingresos', 'ventas', 'total_ventas', 'total', 'monto'], paymentFromOverview.length)
        : data.ventasMetodoPago.length
          ? groupRows(data.ventasMetodoPago, ['metodo_pago', 'nombre'], ['ingresos', 'ventas', 'total_ventas', 'total', 'monto'], data.ventasMetodoPago.length)
          : groupRows(data.ventas, ['metodo_pago'], ['total', 'monto'], data.ventas.length),
      topProductos: topProductsFromOverview.length ? groupRows(topProductsFromOverview, ['producto', 'nombre'], ['cantidad_vendida', 'unidades', 'cantidad', 'ingresos', 'total']) : groupRows(data.ventas, ['producto'], ['cantidad', 'unidades'], 6),
      mixProductos: mixFromOverview.length ? groupRows(mixFromOverview, ['categoria', 'producto', 'nombre'], ['ingresos', 'total_ventas', 'total', 'cantidad']) : groupRows(data.ventas, ['producto'], ['total', 'monto'], 6),
      reclamosPorMes: normalizeMonthly(data.reclamosMes, ['total_reclamos', 'reclamos', 'cantidad', 'total']),
      clientesVip: pickOverviewSection(data.overview, ['clientes_vip'], data.reclamosCliente),
      ventasRecientes: pickOverviewSection(data.overview, ['ventas_recientes'], data.ventas),
      stockCritico: pickOverviewSection(data.overview, ['stock_critico'], data.stockBajo.length ? data.stockBajo : data.stock),
    }
  }, [data])

  return {
    data,
    model,
    errors,
    loading,
    refreshing,
    refetch: () => load({ silent: true }),
  }
}

import Card from '../ui/Card'
import Loader from '../ui/Loader'
import { useApi } from '../../hooks/useApi'
import { getDashboardKpis } from '../../services/api'
import { formatCurrency } from '../../utils/formatCurrency'

function Kpi({ title, value, subtitle }) {
  return (
    <Card className="flex flex-col">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </Card>
  )
}

export default function KpiCards({ filters }) {
  const { data, loading, error } = useApi(() => getDashboardKpis(filters), [JSON.stringify(filters)])
  const k = data || {}

  if (loading) return <div className="grid grid-cols-4 gap-4"><Loader /></div>
  if (error) return <div className="text-red-600">Error cargando KPIs</div>

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Kpi title="Total ventas" value={formatCurrency(k.total_ventas)} />
      <Kpi title="Unidades vendidas" value={Number(k.unidades_vendidas || 0).toLocaleString()} />
      <Kpi title="Total transacciones" value={Number(k.total_transacciones || 0).toLocaleString()} />
      <Kpi title="Ticket promedio" value={formatCurrency(k.ticket_promedio)} />
      <Kpi title="Total reclamos" value={Number(k.total_reclamos || 0).toFixed(0)} />
      <Kpi title="Total alertas" value={Number(k.total_alertas || 0).toFixed(0)} />
      <Kpi title="Stock total" value={Number(k.stock_total || 0).toLocaleString()} />
    </div>
  )
}

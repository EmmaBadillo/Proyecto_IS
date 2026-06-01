import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { getVentasVendedor } from '../../services/api'
import Loader from '../ui/Loader'

export default function SalesSellerChart({ filters }) {
  const { data, loading, error } = useApi(() => getVentasVendedor(filters), [JSON.stringify(filters)])
  const rows = data || []
  if (loading) return <Loader />
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin datos</div>

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="mb-2">Ventas por vendedor</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows}>
          <CartesianGrid stroke="var(--grid, rgba(148, 163, 184, 0.16))" vertical={false} />
          <XAxis dataKey="vendedor" tick={{ fill: 'var(--muted-axis, #92a5c7)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--muted-axis, #92a5c7)' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(34, 211, 238, 0.08)', stroke: 'rgba(34, 211, 238, 0.22)' }} formatter={(v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)} />
          <Bar dataKey="total_ventas" fill="#ff3df2" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { getVentasCategoria } from '../../services/api'
import Loader from '../ui/Loader'

const COLORS = ['#22d3ee', '#a3ff12', '#ff3df2', '#facc15', '#fb7185', '#8b5cf6']

export default function SalesCategoryChart({ filters }) {
  const { data, loading, error } = useApi(() => getVentasCategoria(filters), [JSON.stringify(filters)])
  const rows = data || []

  if (loading) return <Loader />
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin datos</div>

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="mb-2">Ventas por categoría</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={rows} dataKey="total_ventas" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} fill="#22d3ee">
            {rows.map((entry, i) => <Cell key={entry.categoria} fill={COLORS[i % COLORS.length]} stroke="#08111f" strokeWidth={2} />)}
          </Pie>
          <Tooltip cursor={false} formatter={(v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

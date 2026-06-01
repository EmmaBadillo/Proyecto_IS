import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { getVentasMetodoPago } from '../../services/api'
import Loader from '../ui/Loader'

const COLORS = ['#22d3ee', '#a3ff12', '#ff3df2', '#facc15', '#fb7185', '#8b5cf6']

export default function PaymentMethodChart({ filters }) {
  const { data, loading, error } = useApi(() => getVentasMetodoPago(filters), [JSON.stringify(filters)])
  const rows = data || []
  if (loading) return <Loader />
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin datos</div>

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="mb-2">Ventas por método de pago</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={rows} dataKey="total_ventas" nameKey="metodo_pago" cx="50%" cy="50%" outerRadius={70}>
            {rows.map((r, i) => <Cell key={r.metodo_pago} fill={COLORS[i % COLORS.length]} stroke="#08111f" strokeWidth={2} />)}
          </Pie>
          <Tooltip cursor={false} formatter={(v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

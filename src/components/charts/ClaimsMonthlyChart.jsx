import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, Cell, CartesianGrid } from 'recharts'
import { useApi } from '../../hooks/useApi'
import { getReclamos } from '../../services/api'
import { asArray } from '../../utils/dashboardMappers'
import Loader from '../ui/Loader'

function monthFromRow(row) {
  const value = row.nombre_mes || row.mes_nombre || row.mes || row.month || row.periodo || row.fecha || row.created_at
  if (!value) return 'Sin mes'
  if (typeof value === 'number') return `Mes ${value}`
  const text = String(value)
  if (/^\d{4}-\d{2}/.test(text)) {
    return new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(new Date(`${text.slice(0, 7)}-01T00:00:00`))
  }
  return text.slice(0, 14)
}

export default function ClaimsMonthlyChart({ filters, monthlyData = [] }) {
  const clean = Object.fromEntries(Object.entries(filters || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  const { data, loading, error } = useApi(() => getReclamos(clean), [JSON.stringify(clean)])
  const rows = asArray(data || [])
  if (loading) return <Loader />
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin datos</div>

  const total = rows.length
  const monthlyRows = monthlyData.length
    ? monthlyData.slice(-6)
    : Object.entries(rows.reduce((acc, row) => {
        const month = monthFromRow(row)
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {})).map(([name, value]) => ({ name, value })).slice(-6)

  const grouped = rows.reduce((acc, r) => {
    const key = r.categoria || r.category || 'Sin categoría'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const dataByCategory = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // color palette
  const colors = ['#22d3ee', '#a3ff12', '#ff3df2', '#facc15', '#fb7185', '#8b5cf6', '#34d399']

  // Custom tooltip: show list of rows for the hovered category (up to 6)
  function CategoryTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null
    const cat = payload[0].payload.name
    const count = payload[0].value
    const items = rows.filter(r => (r.categoria || r.category || 'Sin categoría') === cat).slice(0, 6)
    return (
      <div style={{ background: '#08111f', border: '1px solid rgba(34, 211, 238, 0.28)', color: '#e6f3ff', boxShadow: '0 18px 42px rgba(0,0,0,0.4)', padding: 10, borderRadius: 8, minWidth: 220 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{cat} — {count}</div>
        {items.length ? (
          <div style={{ fontSize: 13, color: '#d8e5fb' }}>
            {items.map((it, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(148, 163, 184, 0.16)' : 'none' }}>
                <div style={{ fontWeight: 700 }}>{it.cliente || it.nombre_cliente || it.customer || '—'}</div>
                <div style={{ fontSize: 12, color: '#92a5c7' }}>{it.producto || it.nombre_producto || it.product || '—'} — {it.fecha || ''}</div>
              </div>
            ))}
            {rows.length > items.length && <div style={{ marginTop: 8, fontSize: 12, color: '#92a5c7' }}>Mostrando {items.length} de {count}</div>}
          </div>
        ) : <div style={{ color: '#92a5c7' }}>No hay filas para esta categoría</div>}
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded shadow claims-chart-card">
      <div className="claims-chart-header">
        <div>
          <h3 className="mb-0">Reclamos</h3>
          <span>Meses y categorías</span>
        </div>
        <div className="claims-total">Total: <strong>{total}</strong></div>
      </div>
      <div className="claims-month-strip">
        {monthlyRows.map((item, index) => {
          const max = Math.max(...monthlyRows.map((row) => Number(row.value) || 0), 1)
          const pct = Math.max(8, ((Number(item.value) || 0) / max) * 100)
          return (
            <div className="claims-month-pill" key={`${item.name}-${index}`}>
              <span>{item.name}</span>
              <strong>{item.value}</strong>
              <i style={{ width: `${pct}%` }} />
            </div>
          )
        })}
      </div>
      <div className="claims-category-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataByCategory} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="var(--grid, rgba(148, 163, 184, 0.16))" vertical={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={126} tick={{ fill: 'var(--muted-axis, #7b8798)', fontSize: 12, fontWeight: 800 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(34, 211, 238, 0.08)', stroke: 'rgba(34, 211, 238, 0.22)' }} />
            <Bar dataKey="value" barSize={14} radius={[0, 8, 8, 0]}>
              {dataByCategory.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
              <LabelList dataKey="value" position="right" style={{ fill: 'var(--muted-axis, #7b8798)', fontWeight: 800, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

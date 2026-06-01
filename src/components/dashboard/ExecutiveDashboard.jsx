import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Bell,
  Boxes,
  CreditCard,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Search,
  SearchX,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getHttpErrorMessage, techstoreDashboardApi } from '../../services/techstoreDashboardApi'
import { useDashboardData } from '../../hooks/useDashboardData'
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent } from '../../utils/dashboardFormatters'
import { getFirstValue, toNumber } from '../../utils/dashboardMappers'
import ClaimsMonthlyChart from '../charts/ClaimsMonthlyChart'

const chartColors = ['#22d3ee', '#a3ff12', '#ff3df2', '#facc15', '#fb7185', '#8b5cf6', '#34d399']
const mutedAxis = '#92a5c7'
const chartGrid = 'rgba(148, 163, 184, 0.16)'
const chartPanel = '#08111f'
const chartHoverCursor = { fill: 'rgba(34, 211, 238, 0.08)', stroke: 'rgba(34, 211, 238, 0.22)' }

const initialFilters = {
  anio: '',
  mes: '',
  id_sucursal: '',
  id_producto: '',
  id_cliente: '',
  id_vendedor: '',
  id_metodo_pago: '',
  categoria: '',
}

const filterLabels = {
  anio: 'Año',
  anios: 'Años',
  mes: 'Mes',
  id_sucursal: 'Sucursal',
  id_producto: 'Producto',
  id_cliente: 'Cliente',
  id_vendedor: 'Vendedor',
  id_metodo_pago: 'Pago',
  categoria: 'Categoría',
}

const detailLabels = {
  stock_actual: 'Stock actual',
  dias_estimados_stock: 'Días estimados de stock',
  unidades_vendidas_30d: 'Unidades vendidas en 30 días',
  id_venta_odoo: 'Venta Odoo',
  id_fact_venta: 'Factura de venta',
  id_venta: 'Venta',
  id_producto: 'Producto',
  id_cliente: 'Cliente',
  id_sucursal: 'Sucursal',
  id_vendedor: 'Vendedor',
  id_metodo_pago: 'Método de pago',
  total_comprado: 'Total comprado',
  tipo_alerta: 'Tipo de alerta',
  fecha_alerta: 'Fecha de alerta',
  error_desc: 'Descripción del error',
  valores_fila: 'Valores de la fila',
}

function humanizeKey(key) {
  if (detailLabels[key]) return detailLabels[key]
  return key
    .replace(/^id_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDetailValue(key, value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)

  const numericValue = toNumber(value)
  if (numericValue !== null && ['total', 'subtotal', 'monto', 'iva', 'precio', 'precio_unitario', 'total_comprado'].includes(key)) {
    return formatCurrency(numericValue)
  }
  if (numericValue !== null && ['stock_actual', 'stock', 'minimo', 'unidades_vendidas_30d', 'dias_estimados_stock', 'cantidad', 'unidades'].includes(key)) {
    return formatNumber(numericValue)
  }
  if (['fecha', 'fecha_alerta', 'created_at', 'inicio', 'fecha_inicio'].includes(key)) {
    return formatDateTime(value)
  }

  return String(value)
}

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function normalizeOptions(payload) {
  return payload?.data || payload || {}
}

function normalizeCatalog(payload) {
  const value = payload?.data ?? payload?.results ?? payload?.items ?? payload
  return Array.isArray(value) ? value : []
}

function optionLabel(item, keys) {
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  return String(getFirstValue(item, keys, 'Sin nombre'))
}

function optionValue(item, keys) {
  if (typeof item === 'string' || typeof item === 'number') return item
  return getFirstValue(item, keys, '')
}

function normalizeComboOptions(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.data || payload?.results || []
  return rows.map((item) => ({
    value: optionValue(item, ['id', 'value', 'id_cliente', 'id_producto', 'id_sucursal', 'categoria']),
    label: optionLabel(item, ['label', 'nombre', 'cliente', 'producto', 'sucursal', 'categoria']),
    subtitle: typeof item === 'object' ? item.subtitle : '',
  }))
}

function filterLocalOptions(rows, search, idKeys, labelKeys) {
  const term = search.trim().toLowerCase()
  return (rows || [])
    .map((item) => ({
      id: optionValue(item, idKeys),
      label: optionLabel(item, labelKeys),
      subtitle: optionLabel(item, ['subtitle', 'estado', 'categoria']),
    }))
    .filter((item) => !term || item.label.toLowerCase().includes(term) || String(item.subtitle || '').toLowerCase().includes(term))
    .slice(0, 12)
}

function Skeleton({ rows = 1, className = '' }) {
  return (
    <div className={`skeleton-stack ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-line" key={index} />
      ))}
    </div>
  )
}

function EmptyState({ title = 'Sin datos', detail = 'No hay registros para los filtros actuales.' }) {
  return (
    <div className="empty-state">
      <SearchX size={22} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}

function ErrorBanner({ errors }) {
  if (!errors.length) return null
  return (
    <div className="error-banner">
      <AlertTriangle size={18} />
      <div>
        <strong>Algunas secciones no pudieron cargarse</strong>
        <span>{errors.slice(0, 3).map((error) => `${error.section}: ${error.message}`).join(' · ')}</span>
      </div>
    </div>
  )
}

function DashboardCard({ title, icon: Icon, children, action, className = '' }) {
  return (
    <section className={`dashboard-card ${className}`}>
      <div className="card-heading">
        <div>
          <span>{title}</span>
        </div>
        {Icon ? <Icon size={17} /> : action}
      </div>
      {children}
    </section>
  )
}

function SearchCombo({ label, placeholder, value, selectedLabel, onSelect, loadOptions }) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState({})
  const inputRef = useRef(null)

  function computeMenuStyle(rect) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const spaceBelow = Math.max(0, vh - rect.bottom)
    const spaceAbove = Math.max(0, rect.top)
    const desiredMax = 320
    let left = rect.left
    let width = rect.width || 300
    const horizontalPadding = 8
    if (left + width > vw - horizontalPadding) left = Math.max(horizontalPadding, vw - width - horizontalPadding)

    const maxBelow = Math.max(spaceBelow - 16, 80)
    const maxAbove = Math.max(spaceAbove - 16, 80)
    let top
    let maxHeight
    if (spaceBelow >= Math.min(desiredMax, maxBelow) || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6
      maxHeight = Math.min(desiredMax, Math.max(80, spaceBelow - 16))
    } else {
      maxHeight = Math.min(desiredMax, Math.max(80, spaceAbove - 16))
      top = rect.top - maxHeight - 6
    }
    return { top, left, width, maxHeight }
  }

  useEffect(() => {
    if (!open) return undefined
    let mounted = true
    setLoading(true)
    const timer = window.setTimeout(() => {
      loadOptions(query)
        .then((payload) => {
          if (mounted) setOptions(normalizeComboOptions(payload))
        })
        .catch(() => {
          if (mounted) setOptions([])
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    }, 180)

    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [query, open, loadOptions])

  return (
    <label className="combo-field" ref={containerRef}>
      <span>{label}</span>
      <div className="combo-shell">
        <Search size={15} />
        <input
          value={open ? query : selectedLabel || ''}
          placeholder={placeholder}
          onFocus={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMenuStyle(computeMenuStyle(rect))
            setOpen(true)
            // keep existing query so user can continue typing
            setTimeout(() => inputRef.current && inputRef.current.focus(), 0)
          }}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => window.setTimeout(() => setOpen(false), 220)}
          ref={inputRef}
        />
        {value && (
          <button
            aria-label={`Limpiar ${label}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onSelect('', '')
              setQuery('')
              setOpen(true)
              setTimeout(() => inputRef.current && inputRef.current.focus(), 0)
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (createPortal(
        <div ref={menuRef} className="combo-portal-menu" style={{ width: menuStyle.width || 300, top: menuStyle.top, left: menuStyle.left, maxHeight: menuStyle.maxHeight || 280 }} onMouseDown={(e) => e.stopPropagation()}>
          {loading && <div className="combo-option muted">Buscando...</div>}
          {!loading && options.map((option) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              className="combo-option"
              onMouseDown={(event) => {
                event.preventDefault()
                onSelect(option.value, option.label)
                setOpen(false)
              }}
            >
              <strong>{option.label}</strong>
              {option.subtitle && <small>{option.subtitle}</small>}
            </button>
          ))}
          {!loading && !options.length && <div className="combo-option muted">Sin resultados</div>}
        </div>, document.body))}
    </label>
  )
}

function FiltersPanel({ appliedFilters, onApply, onClear }) {
  const [filters, setFilters] = useState(initialFilters)
  const [labels, setLabels] = useState({})
  const [options, setOptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setFilters((current) => ({ ...current, ...appliedFilters }))
  }, [appliedFilters])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    techstoreDashboardApi.getFiltros()
      .then((payload) => {
        if (mounted) setOptions(normalizeOptions(payload))
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'No se pudieron cargar los filtros.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    techstoreDashboardApi.getFiltroVendedores()
      .then((payload) => {
        if (!mounted) return
        const vendedores = normalizeCatalog(payload)
        setOptions((current) => ({
          ...current,
          vendedores: vendedores.length ? vendedores : current.vendedores,
        }))
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const update = (key, value, label) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    if (label !== undefined) {
      setLabels((current) => ({ ...current, [key]: label }))
    }
    onApply(cleanFilters(next))
  }
  const active = cleanFilters(appliedFilters)
  const clear = () => {
    setFilters(initialFilters)
    setLabels({})
    onClear()
  }

  return (
    <DashboardCard title="Filtros globales" icon={Filter} className="filters-card">
      <div className="filters-grid">
        <label>
          <span>Año</span>
          <select value={filters.anio} onChange={(event) => update('anio', event.target.value, event.target.value)}>
            <option value="">Todos</option>
            {(options.anios || []).map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Mes</span>
          <select value={filters.mes} onChange={(event) => update('mes', event.target.value, event.target.selectedOptions[0]?.text || '')}>
            <option value="">Todos</option>
            {(options.meses || []).map((item) => (
              <option value={optionValue(item, ['mes'])} key={optionValue(item, ['mes'])}>
                {optionLabel(item, ['nombre_mes', 'mes'])}
              </option>
            ))}
          </select>
        </label>
        <SearchCombo
          label="Sucursal"
          placeholder="Buscar sucursal"
          value={filters.id_sucursal}
          selectedLabel={labels.id_sucursal}
          loadOptions={techstoreDashboardApi.searchSucursales}
          onSelect={(value, label) => update('id_sucursal', value, label)}
        />
        <SearchCombo
          label="Producto"
          placeholder="Buscar producto"
          value={filters.id_producto}
          selectedLabel={labels.id_producto}
          loadOptions={techstoreDashboardApi.searchProductos}
          onSelect={(value, label) => update('id_producto', value, label)}
        />
        <SearchCombo
          label="Cliente"
          placeholder="Buscar cliente"
          value={filters.id_cliente}
          selectedLabel={labels.id_cliente}
          loadOptions={techstoreDashboardApi.searchClientes}
          onSelect={(value, label) => update('id_cliente', value, label)}
        />
        <SearchCombo
          label="Vendedor"
          placeholder="Buscar vendedor"
          value={filters.id_vendedor}
          selectedLabel={labels.id_vendedor}
          loadOptions={techstoreDashboardApi.searchVendedores}
          onSelect={(value, label) => update('id_vendedor', value, label)}
        />
        <SearchCombo
          label="Pago"
          placeholder="Buscar pago"
          value={filters.id_metodo_pago}
          selectedLabel={labels.id_metodo_pago}
          loadOptions={(search) => Promise.resolve(filterLocalOptions(options.metodos_pago, search, ['id_metodo_pago', 'id'], ['metodo_pago', 'nombre', 'label']))}
          onSelect={(value, label) => update('id_metodo_pago', value, label)}
        />
        <SearchCombo
          label="Categoría"
          placeholder="Buscar categoría"
          value={filters.categoria}
          selectedLabel={labels.categoria}
          loadOptions={techstoreDashboardApi.searchCategorias}
          onSelect={(value, label) => update('categoria', value, label)}
        />
      </div>
      <div className="filters-actions">
        <button className="ghost-button" type="button" onClick={clear}>Limpiar filtros</button>
        <span className="muted-text">Los cambios se aplican automáticamente.</span>
        {loading && <span className="muted-text">Cargando filtros...</span>}
        {error && <span className="danger-text">{error}</span>}
      </div>
      <div className="active-chips">
        {Object.entries(active).map(([key, value]) => (
          <span className="filter-chip" key={key}>
            <strong>{filterLabels[key] || key}</strong>
            <em>{labels[key] || value}</em>
          </span>
        ))}
        {!Object.keys(active).length && <span className="muted-text">Sin filtros activos</span>}
      </div>
    </DashboardCard>
  )
}

function KpiGrid({ kpis, loading }) {
  const items = [
    { label: 'Total ventas', value: formatCurrency(kpis.totalVentas), icon: TrendingUp, tone: 'blue', delta: formatPercent(kpis.variacionVentas) },
    { label: 'Variación ventas', value: formatPercent(kpis.variacionVentas), icon: TrendingUp, tone: 'green' },
    { label: 'Transacciones', value: formatNumber(kpis.transacciones), icon: ShoppingCart, tone: 'cyan' },
    { label: 'Ticket promedio', value: formatCurrency(kpis.ticketPromedio), icon: CreditCard, tone: 'amber' },
    { label: 'Unidades vendidas', value: formatNumber(kpis.unidadesVendidas), icon: Boxes, tone: 'violet' },
    { label: 'Clientes únicos', value: formatNumber(kpis.clientesUnicos), icon: Users, tone: 'teal' },
    { label: 'Productos vendidos', value: formatNumber(kpis.productosVendidos), icon: PackageSearch, tone: 'slate' },
    { label: 'Alertas activas', value: formatNumber(kpis.alertasActivas), icon: Bell, tone: 'red' },
  ]

  return (
    <div className="kpi-grid">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div className={`kpi-card kpi-${item.tone}`} key={item.label}>
            {loading ? <Skeleton rows={2} /> : (
              <>
                <div className="kpi-top">
                  <span>{item.label}</span>
                  <Icon size={18} />
                </div>
                <strong>{item.value}</strong>
                {item.delta && (
                  <small className="kpi-delta">
                    <span>{item.delta}</span>
                    <em>vs periodo anterior</em>
                  </small>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SalesQuickKpis({ kpis, loading }) {
  const items = [
    { label: 'Ventas', value: formatCurrency(kpis.totalVentas), icon: TrendingUp, tone: 'blue' },
    { label: 'Transacciones', value: formatNumber(kpis.transacciones), icon: ShoppingCart, tone: 'cyan' },
    { label: 'Ticket promedio', value: formatCurrency(kpis.ticketPromedio), icon: CreditCard, tone: 'amber' },
    { label: 'Unidades', value: formatNumber(kpis.unidadesVendidas), icon: Boxes, tone: 'teal' },
  ]

  return (
    <div className="sales-kpi-grid">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div className={`kpi-card kpi-${item.tone}`} key={item.label}>
            {loading ? <Skeleton rows={2} /> : (
              <>
                <div className="kpi-top">
                  <span>{item.label}</span>
                  <Icon size={18} />
                </div>
                <strong>{item.value}</strong>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function sumChartValues(rows) {
  return (rows || []).reduce((total, row) => total + toNumber(row.value), 0)
}

function topChartItem(rows) {
  return [...(rows || [])].sort((a, b) => toNumber(b.value) - toNumber(a.value))[0]
}

function chartShare(value, total) {
  if (!total) return '0%'
  return `${Math.round((toNumber(value) / total) * 100)}%`
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{label || payload[0].name}</strong>
      <span>{formatCurrency(payload[0].value)}</span>
    </div>
  )
}

function SalesDot(props) {
  const { cx, cy } = props
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="rgba(34, 211, 238, 0.2)" />
      <circle cx={cx} cy={cy} r={4} fill="#22d3ee" stroke="#07111f" strokeWidth={2} />
    </g>
  )
}

function NumberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{label || payload[0].name}</strong>
      <span>{formatNumber(payload[0].value)}</span>
    </div>
  )
}

function ChartLegendList({ data, money = true, limit }) {
  const total = sumChartValues(data)
  const rows = typeof limit === 'number' ? (data || []).slice(0, limit) : (data || [])
  return (
    <div className="chart-legend-list">
      {rows.map((item, index) => (
        <div className="legend-row" key={item.name}>
          <span className="legend-dot" style={{ background: chartColors[index % chartColors.length] }} />
          <span className="legend-name">{item.name}</span>
          <strong>{money ? formatCurrency(item.value) : formatNumber(item.value)}</strong>
          <em>{chartShare(item.value, total)}</em>
        </div>
      ))}
    </div>
  )
}

function CategoryShareBars({ data }) {
  const total = sumChartValues(data)

  return (
    <div className="category-bars-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 38, left: 12, bottom: 0 }}>
          <CartesianGrid stroke={chartGrid} horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={104}
            tickLine={false}
            axisLine={false}
            tick={{ fill: mutedAxis, fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip content={<MoneyTooltip />} cursor={chartHoverCursor} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={14}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="category-percent-list">
        {data.map((item) => (
          <span key={item.name}>{total ? Math.round((toNumber(item.value) / total) * 100) : 0}%</span>
        ))}
      </div>
    </div>
  )
}

function CompactHorizontalBars({ data, tooltip = 'number' }) {
  const total = sumChartValues(data)

  return (
    <div className="compact-bars-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 38, left: 12, bottom: 0 }}>
          <CartesianGrid stroke={chartGrid} horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={116}
            tickLine={false}
            axisLine={false}
            tick={{ fill: mutedAxis, fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip content={tooltip === 'money' ? <MoneyTooltip /> : <NumberTooltip />} cursor={chartHoverCursor} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={14}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="compact-percent-list">
        {data.map((item) => (
          <span key={item.name}>{total ? Math.round((toNumber(item.value) / total) * 100) : 0}%</span>
        ))}
      </div>
    </div>
  )
}

function ClaimsMonthList({ data }) {
  return (
    <div className="claims-month-list">
      {(data || []).map((item) => (
        <div className="claims-month-row" key={item.name}>
          <span>{item.name}</span>
          <strong>{formatNumber(item.value)}</strong>
          <em>reclamos</em>
        </div>
      ))}
    </div>
  )
}

function ChartFrame({ title, eyebrow, metric, children, loading, data, className = '' }) {
  return (
    <DashboardCard title={title} className={`chart-card ${className}`}>
      <div className="chart-meta">
        <span>{eyebrow}</span>
        {metric && <strong>{metric}</strong>}
      </div>
      {loading ? <Skeleton rows={6} /> : data?.length ? children : <EmptyState />}
    </DashboardCard>
  )
}

function SalesTrendChart({ data }) {
  if (data.length === 1) {
    const point = data[0]
    return (
      <div className="single-sales-point">
        <div className="single-point-marker">
          <span />
          <em>{point.name}</em>
        </div>
        <strong>{formatCurrency(point.value)}</strong>
        <small>Periodo seleccionado</small>
      </div>
    )
  }

  return (
    <div className="chart-box chart-box-large">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 20, left: 0, bottom: 0 }}>
          <defs>
                <linearGradient id="salesGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.42} />
                  <stop offset="55%" stopColor="#ff3df2" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#08111f" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartGrid} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: mutedAxis, fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={58} tick={{ fill: mutedAxis, fontSize: 12 }} />
              <Tooltip content={<MoneyTooltip />} cursor={{ stroke: 'rgba(34, 211, 238, 0.48)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={3}
                fill="url(#salesGradient)"
                dot={<SalesDot />}
                activeDot={{ r: 7, fill: '#ff3df2', stroke: chartPanel, strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
    </div>
  )
}

function ChartsGrid({ model, loading, filters }) {
  const salesTotal = sumChartValues(model.ventasPorMes)
  const topCategory = topChartItem(model.ventasPorCategoria)
  const topBranch = topChartItem(model.ventasPorSucursal)
  const topPayment = topChartItem(model.ventasPorMetodoPago)
  const topProduct = topChartItem(model.topProductos)
  const claimsTotal = sumChartValues(model.reclamosPorMes)

  return (
    <div className="charts-grid">
      <ChartFrame title="Ventas por mes" eyebrow="Tendencia de ingresos" metric={formatCurrency(salesTotal)} loading={loading} data={model.ventasPorMes} className="chart-card-large">
        <SalesTrendChart data={model.ventasPorMes} />
      </ChartFrame>

      <ChartFrame title="Ventas por categoría" eyebrow="Concentración" metric={topCategory?.name} loading={loading} data={model.ventasPorCategoria}>
        <div className="category-panel">
          <CategoryShareBars data={model.ventasPorCategoria} />
        </div>
      </ChartFrame>

      <ChartFrame title="Top productos" eyebrow="Unidades o ingresos" metric={topProduct?.name} loading={loading} data={model.topProductos}>
        <div className="top-products-panel">
          <CompactHorizontalBars data={model.topProductos} />
        </div>
      </ChartFrame>

      <ChartFrame title="Ventas por sucursal" eyebrow="Mejor sucursal" metric={topBranch?.name} loading={loading} data={model.ventasPorSucursal}>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={model.ventasPorSucursal} layout="vertical" margin={{ top: 8, right: 18, left: 12, bottom: 8 }}>
              <CartesianGrid stroke={chartGrid} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={118} tick={{ fill: mutedAxis, fontSize: 12 }} />
              <Tooltip content={<MoneyTooltip />} cursor={chartHoverCursor} />
              <Bar dataKey="value" fill="#34d399" radius={[0, 8, 8, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartFrame>

      <ChartFrame title="Métodos de pago" eyebrow="Principal" metric={topPayment?.name} loading={loading} data={model.ventasPorMetodoPago}>
        <div className="payment-method-panel">
          <div className="donut-box payment-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={model.ventasPorMetodoPago} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3}>
                  {model.ventasPorMetodoPago.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} stroke={chartPanel} strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<MoneyTooltip />} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
            <div className="payment-donut-center">
              <span>Total</span>
              <strong>{formatCurrency(sumChartValues(model.ventasPorMetodoPago))}</strong>
            </div>
          </div>
          <div className="payment-method-list">
            <ChartLegendList data={model.ventasPorMetodoPago} />
          </div>
        </div>
      </ChartFrame>

      <ChartFrame title="Reclamos" eyebrow="Total reclamos" metric={formatNumber(claimsTotal)} loading={loading} data={model.reclamosPorMes}>
        <ClaimsMonthlyChart filters={filters} monthlyData={model.reclamosPorMes} />
      </ChartFrame>
    </div>
  )
}

function DataTable({ title, rows, columns, loading, onRowClick, maxRows = 6, className = '' }) {
  const visibleRows = rows.slice(0, maxRows)
  return (
    <DashboardCard title={title} className={className}>
      {loading ? <Skeleton rows={5} /> : visibleRows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={getFirstValue(row, ['id', 'id_venta', 'id_producto', 'id_alerta'], index)} onClick={() => onRowClick?.(row)}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row) : getFirstValue(row, [column.key], '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState />}
    </DashboardCard>
  )
}

function OperationalPanel({ title, tone, count, children, loading, emptyTitle, emptyDetail }) {
  return (
    <section className={`ops-insight-card ${tone}`}>
      <div className="ops-insight-head">
        <div>
          <span>{title}</span>
          <strong>{formatNumber(count)}</strong>
        </div>
        <em>{count === 1 ? 'registro' : 'registros'}</em>
      </div>
      {loading ? <Skeleton rows={4} /> : count ? children : <EmptyState title={emptyTitle} detail={emptyDetail} />}
    </section>
  )
}

function VipCustomersPanel({ rows, loading, onDetail }) {
  const visibleRows = rows.slice(0, 5)
  return (
    <OperationalPanel
      title="Clientes VIP"
      tone="vip"
      count={rows.length}
      loading={loading}
      emptyTitle="Sin clientes VIP"
      emptyDetail="No hay clientes destacados para los filtros actuales."
    >
      <div className="ops-insight-list">
        {visibleRows.map((row, index) => {
          const name = getFirstValue(row, ['cliente', 'nombre'], 'Cliente sin nombre')
          const total = getFirstValue(row, ['total_comprado', 'total', 'monto'], 0)
          const claims = getFirstValue(row, ['total_reclamos', 'reclamos', 'cantidad'], 0)
          return (
            <button type="button" className="ops-insight-row vip-row" key={`${name}-${index}`} onClick={() => onDetail({ title: 'Cliente', row })}>
              <span className="rank-badge">{index + 1}</span>
              <div>
                <strong>{name}</strong>
                <small>{formatNumber(claims)} reclamos</small>
              </div>
              <em>{formatCurrency(total)}</em>
            </button>
          )
        })}
      </div>
    </OperationalPanel>
  )
}

function CriticalStockPanel({ rows, loading, onDetail }) {
  const visibleRows = rows.slice(0, 5)
  return (
    <OperationalPanel
      title="Stock crítico"
      tone="stock"
      count={rows.length}
      loading={loading}
      emptyTitle="Stock estable"
      emptyDetail="No hay productos críticos para los filtros actuales."
    >
      <div className="ops-insight-list">
        {visibleRows.map((row, index) => {
          const product = getFirstValue(row, ['producto', 'nombre'], 'Producto sin nombre')
          const category = getFirstValue(row, ['categoria'], 'Sin categoría')
          const stock = toNumber(getFirstValue(row, ['stock_actual', 'stock'], 0))
          const level = Math.max(0, Math.min(100, (stock / 10) * 100))
          return (
            <button type="button" className="ops-insight-row stock-row" key={`${product}-${index}`} onClick={() => onDetail({ title: 'Producto crítico', row })}>
              <span className="stock-dot" />
              <div>
                <strong>{product}</strong>
                <small>{category}</small>
                <span className="stock-meter"><i style={{ width: `${level}%` }} /></span>
              </div>
              <em>{formatNumber(stock)}</em>
            </button>
          )
        })}
      </div>
    </OperationalPanel>
  )
}

function OperationalAlertsPanel({ rows, loading, onDetail }) {
  const visibleRows = rows.slice(0, 5)
  return (
    <OperationalPanel
      title="Alertas operativas"
      tone="alerts"
      count={rows.length}
      loading={loading}
      emptyTitle="Sin alertas"
      emptyDetail="No hay alertas operativas para los filtros actuales."
    >
      <div className="ops-insight-list">
        {visibleRows.map((row, index) => {
          const type = getFirstValue(row, ['tipo_alerta', 'tipo', 'nivel'], 'Alerta')
          const message = getFirstValue(row, ['mensaje', 'descripcion'], 'Sin descripción')
          const date = formatDateTime(getFirstValue(row, ['fecha_alerta', 'fecha']))
          return (
            <button type="button" className="ops-insight-row alert-row" key={`${type}-${index}`} onClick={() => onDetail({ title: 'Alerta', row })}>
              <span className="alert-pulse" />
              <div>
                <strong>{type}</strong>
                <small>{message}</small>
              </div>
              <em>{date}</em>
            </button>
          )
        })}
      </div>
    </OperationalPanel>
  )
}

function getLatestByDate(rows, dateKeys) {
  return [...(rows || [])].sort((a, b) => {
    const dateA = new Date(getFirstValue(a, dateKeys, 0)).getTime() || 0
    const dateB = new Date(getFirstValue(b, dateKeys, 0)).getTime() || 0
    return dateB - dateA
  })[0]
}

function groupByMessage(rows) {
  const grouped = (rows || []).reduce((acc, row) => {
    const message = getFirstValue(row, ['error_desc', 'error', 'mensaje'], 'Sin descripción')
    acc[message] = (acc[message] || 0) + 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function EtlDashboard({ data, loading, tableColumns, onDetail }) {
  const logs = data.logs || []
  const errors = data.errores || []
  const latestLog = getLatestByDate(logs, ['inicio', 'fecha_inicio', 'fecha'])
  const latestError = getLatestByDate(errors, ['fecha', 'created_at'])
  const okLogs = logs.filter((row) => String(getFirstValue(row, ['estado', 'status'], '')).toLowerCase().includes('correct')).length
  const errorGroups = groupByMessage(errors)

  return (
    <div className="etl-dashboard">
      <section className="etl-hero">
        <div>
          <span className="eyebrow">Monitoreo ETL</span>
          <h2>Procesos, rechazos y calidad de carga</h2>
        </div>
        <div className="etl-pulse">
          <span />
          <strong>{errors.length ? 'Con incidencias' : 'Sin incidencias'}</strong>
        </div>
      </section>

      <div className="etl-summary-grid">
        <article className="etl-summary-card tone-cyan">
          <span>Procesos registrados</span>
          <strong>{formatNumber(logs.length)}</strong>
          <small>{okLogs} correctos</small>
        </article>
        <article className="etl-summary-card tone-red">
          <span>Errores detectados</span>
          <strong>{formatNumber(errors.length)}</strong>
          <small>Registros rechazados</small>
        </article>
        <article className="etl-summary-card tone-violet">
          <span>Última carga</span>
          <strong>{latestLog ? formatDateTime(getFirstValue(latestLog, ['inicio', 'fecha_inicio', 'fecha'])) : '-'}</strong>
          <small>{latestLog ? getFirstValue(latestLog, ['estado', 'status'], '-') : 'Sin registros'}</small>
        </article>
        <article className="etl-summary-card tone-amber">
          <span>Última incidencia</span>
          <strong>{latestError ? formatDateTime(getFirstValue(latestError, ['fecha', 'created_at'])) : '-'}</strong>
          <small>{latestError ? String(getFirstValue(latestError, ['error_desc', 'error', 'mensaje'], '-')).slice(0, 42) : 'Sin errores'}</small>
        </article>
      </div>

      <div className="etl-workbench">
        <DashboardCard title="Tipos de errores ETL" className="etl-error-card">
          {loading ? <Skeleton rows={5} /> : errorGroups.length ? (
            <div className="etl-error-list">
              {errorGroups.map((item, index) => (
                <div className="etl-error-row" key={item.message}>
                  <span>{index + 1}</span>
                  <strong>{item.message}</strong>
                  <em>{formatNumber(item.count)}</em>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Sin errores ETL" detail="No hay errores registrados para los filtros actuales." />}
        </DashboardCard>

        <DataTable title="Logs ETL" rows={logs} columns={tableColumns.logs} loading={loading} maxRows={8} onRowClick={(row) => onDetail({ title: 'Log ETL', row })} />
      </div>

      <DashboardCard title="Errores ETL" className="etl-errors-table-card">
        {loading ? <Skeleton rows={7} /> : errors.length ? (
          <div className="table-wrap etl-table-wrap">
            <table>
              <thead>
                <tr>{tableColumns.errores.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
              </thead>
              <tbody>
                {errors.slice(0, 12).map((row, index) => (
                  <tr key={getFirstValue(row, ['id', 'fecha', 'created_at'], index)} onClick={() => onDetail({ title: 'Error ETL', row })}>
                    {tableColumns.errores.map((column) => (
                      <td key={column.key}>{column.render ? column.render(row) : getFirstValue(row, [column.key], '-')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Sin errores ETL" detail="La carga no reporta rechazos." />}
      </DashboardCard>
    </div>
  )
}

function SaleDetailPanel({ sale }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setDetail(null)
    setError('')
    if (!sale) return () => { mounted = false }
    const id = getFirstValue(sale, ['id_fact_venta', 'id_venta', 'id'])
    if (!id) return () => { mounted = false }
    setLoading(true)
    techstoreDashboardApi.getVentaDetalle(id)
      .then((payload) => {
        if (!mounted) return
        setDetail(payload?.data || payload)
      })
      .catch((err) => {
        if (!mounted) return
        setError(getHttpErrorMessage(err))
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [sale])

  if (!sale && !detail && !loading) {
    return (
      <DashboardCard title="Detalle de venta" className="sale-detail-card">
        <EmptyState title="Selecciona una venta" detail="El detalle aparecerá aquí al hacer clic en una fila." />
      </DashboardCard>
    )
  }

  const s = detail || sale

  const commercialFields = [
    ['Venta', getFirstValue(s, ['id_fact_venta', 'id_venta', 'id_venta_odoo', 'id'], '-')],
    ['Fecha', formatDate(getFirstValue(s, ['fecha', 'id_fecha']))],
    ['Cliente', getFirstValue(s, ['cliente', 'nombre_cliente', 'cliente'], '-')],
    ['Producto', getFirstValue(s, ['producto', 'nombre_producto', 'producto'], '-')],
    ['Categoría', getFirstValue(s, ['categoria'], '-')],
  ]
  const operationFields = [
    ['Sucursal', getFirstValue(s, ['sucursal'], '-')],
    ['Vendedor', getFirstValue(s, ['vendedor'], '-')],
    ['Pago', getFirstValue(s, ['metodo_pago'], '-')],
    ['Cantidad', formatNumber(getFirstValue(s, ['cantidad', 'unidades'], 0))],
  ]

  return (
    <DashboardCard title="Detalle de venta" className="sale-detail-card">
      {loading ? (
        <div style={{ padding: 12 }}><Skeleton rows={6} /></div>
      ) : error ? (
        <div className="inline-error">{error}</div>
      ) : (
        <div className="sale-detail-scroll">
          <div className="sale-detail-total">
            <span>Total</span>
            <strong>{formatCurrency(getFirstValue(s, ['total', 'subtotal', 'monto'], 0))}</strong>
            <em>{getFirstValue(s, ['id_venta_odoo', 'id_fact_venta', 'id'], '-')}</em>
          </div>
          <div className="sale-detail-section">
            <h3>Comercial</h3>
            <div className="sale-detail-fields">
              {commercialFields.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="sale-detail-section">
            <h3>Operación</h3>
            <div className="sale-detail-fields compact">
              {operationFields.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="sale-detail-section">
            <h3>Contacto</h3>
            <div className="sale-detail-fields">
              <div>
                <span>Teléfono</span>
                <strong>{getFirstValue(s, ['telefono'], '-')}</strong>
              </div>
              <div>
                <span>Correo</span>
                <strong>{getFirstValue(s, ['correo'], '-')}</strong>
              </div>
              <div>
                <span>Ciudad</span>
                <strong>{getFirstValue(s, ['ciudad'], '-')}</strong>
              </div>
            </div>
          </div>

          <div className="sale-detail-section">
            <h3>Producto</h3>
            <div className="sale-detail-fields">
              <div>
                <span>Proveedor</span>
                <strong>{getFirstValue(s, ['proveedor'], '-')}</strong>
              </div>
              <div>
                <span>Estado producto</span>
                <strong>{getFirstValue(s, ['estado_producto'], '-')}</strong>
              </div>
              <div>
                <span>Precio unitario</span>
                <strong>{formatCurrency(getFirstValue(s, ['precio_unitario', 'precio'], 0))}</strong>
              </div>
            </div>
          </div>

          <div className="sale-detail-section">
            <h3>Resumen de pagos</h3>
            <div className="sale-detail-fields">
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(getFirstValue(s, ['subtotal'], 0))}</strong>
              </div>
              <div>
                <span>IVA</span>
                <strong>{formatCurrency(getFirstValue(s, ['iva'], 0))}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(getFirstValue(s, ['total'], 0))}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

function SalesRouteDashboard({ model, filters, loading, tableColumns }) {
  const [selectedSale, setSelectedSale] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [salesPayload, setSalesPayload] = useState(null)
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesError, setSalesError] = useState('')
  const filtersKey = JSON.stringify(cleanFilters(filters))

    useEffect(() => {
      setPage(1)
    }, [filtersKey])

    useEffect(() => {
      let mounted = true
      setSalesLoading(true)
      setSalesError('')
      techstoreDashboardApi.getVentas({ ...cleanFilters(filters), page, limit })
        .then((payload) => {
          if (mounted) setSalesPayload(payload)
        })
        .catch((error) => {
          if (mounted) setSalesError(getHttpErrorMessage(error))
        })
        .finally(() => {
          if (mounted) setSalesLoading(false)
        })

      return () => {
        mounted = false
      }
    }, [filtersKey, page, limit])

  const rows = Array.isArray(salesPayload?.data)
    ? salesPayload.data
    : Array.isArray(salesPayload)
      ? salesPayload
      : model.ventasRecientes || []

  const totalRows = Number(salesPayload?.total_registros || rows.length || 0)
  const totalPages = Math.max(Math.ceil(totalRows / limit), 1)
  const filteredRows = rows

  const selectSale = (row) => {
    setSelectedSale(row)
  }

  return (
    <>
      <div className="sales-workbench">
        <div className="sales-main-panel">
          <SalesQuickKpis kpis={model.kpis} loading={loading} />
          <DashboardCard title="Todas las ventas" className="sales-table-card">
            <div className="sales-toolbar">
              <span>{formatNumber(totalRows)} ventas</span>
            </div>
            {salesError && <div className="inline-error">{salesError}</div>}
            {salesLoading ? <Skeleton rows={8} /> : filteredRows.length ? (
              <div className="table-wrap sales-table-wrap">
                <table>
                  <thead>
                    <tr>{tableColumns.ventas.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr
                        key={getFirstValue(row, ['id', 'id_venta', 'id_venta_odoo'], index)}
                        className={selectedSale === row ? 'selected-row' : ''}
                        onClick={() => selectSale(row)}
                      >
                        {tableColumns.ventas.map((column) => (
                          <td key={column.key}>{column.render ? column.render(row) : getFirstValue(row, [column.key], '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="Sin ventas" detail="No hay ventas para los filtros y búsqueda actuales." />}
            <div className="sales-pagination">
              <div>
                <span>Página {formatNumber(page)} de {formatNumber(totalPages)}</span>
                <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1}>Anterior</button>
                <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages}>Siguiente</button>
              </div>
            </div>
          </DashboardCard>
        </div>
        <aside className="sales-side-panel">
          <SaleDetailPanel sale={selectedSale || filteredRows[0]} />
        </aside>
      </div>
    </>
  )
}

function DetailModal({ detail, onClose }) {
  if (!detail) return null
  if (detail.loading) {
    return (
      <div className="modal-backdrop" onMouseDown={onClose}>
        <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <div>
              <span>Detalle</span>
              <strong>{detail.title}</strong>
            </div>
            <button type="button" aria-label="Cerrar detalle" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-loading">
            <Skeleton rows={6} />
          </div>
        </div>
      </div>
    )
  }

  const entries = Object.entries(detail.row || {}).filter(([, value]) => value !== null && value !== undefined)

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span>Detalle</span>
            <strong>{detail.title}</strong>
          </div>
          <button type="button" aria-label="Cerrar detalle" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="detail-summary">
          <span>{formatNumber(entries.length)}</span>
          <strong>campos disponibles</strong>
        </div>
        <div className="detail-grid">
          {entries.map(([key, value]) => (
            <div key={key}>
              <span>{humanizeKey(key)}</span>
              <strong>{formatDetailValue(key, value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ExecutiveDashboard({ onLogout }) {
  const [filters, setFilters] = useState({})
  const [detail, setDetail] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [route, setRoute] = useState(() => {
    if (window.location.pathname === '/ventas') return 'ventas'
    if (window.location.pathname === '/etl') return 'etl'
    return 'overview'
  })
  const { data, model, errors, loading, refreshing, refetch } = useDashboardData(filters)

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/ventas') setRoute('ventas')
      else if (window.location.pathname === '/etl') setRoute('etl')
      else setRoute('overview')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (nextRoute) => {
    const path = nextRoute === 'ventas' ? '/ventas' : nextRoute === 'etl' ? '/etl' : '/'
    window.history.pushState({}, '', path)
    setRoute(nextRoute)
  }

  const tableColumns = useMemo(() => ({
    ventas: [
      { key: 'fecha', label: 'Fecha', render: (row) => formatDate(getFirstValue(row, ['fecha', 'id_fecha'])) },
      { key: 'cliente', label: 'Cliente', render: (row) => getFirstValue(row, ['cliente', 'nombre_cliente'], '-') },
      { key: 'producto', label: 'Producto', render: (row) => getFirstValue(row, ['producto', 'nombre_producto'], '-') },
      { key: 'sucursal', label: 'Sucursal', render: (row) => getFirstValue(row, ['sucursal'], '-') },
      { key: 'vendedor', label: 'Vendedor', render: (row) => getFirstValue(row, ['vendedor'], '-') },
      { key: 'metodo_pago', label: 'Pago', render: (row) => getFirstValue(row, ['metodo_pago'], '-') },
      { key: 'cantidad', label: 'Cant.', render: (row) => formatNumber(getFirstValue(row, ['cantidad', 'unidades'], 0)) },
      { key: 'total', label: 'Total', render: (row) => formatCurrency(getFirstValue(row, ['total', 'subtotal', 'monto'])) },
    ],
    clientes: [
      { key: 'cliente', label: 'Cliente', render: (row) => getFirstValue(row, ['cliente', 'nombre'], '-') },
      { key: 'total_comprado', label: 'Compra', render: (row) => formatCurrency(getFirstValue(row, ['total_comprado', 'total', 'monto'])) },
      { key: 'reclamos', label: 'Reclamos', render: (row) => formatNumber(getFirstValue(row, ['total_reclamos', 'reclamos', 'cantidad'], 0)) },
    ],
    stock: [
      { key: 'producto', label: 'Producto', render: (row) => getFirstValue(row, ['producto', 'nombre'], '-') },
      { key: 'categoria', label: 'Categoría', render: (row) => getFirstValue(row, ['categoria'], '-') },
      { key: 'stock', label: 'Stock', render: (row) => <span className={toNumber(getFirstValue(row, ['stock_actual', 'stock'])) <= 5 ? 'status danger' : 'status'}>{formatNumber(getFirstValue(row, ['stock_actual', 'stock']))}</span> },
    ],
    alertas: [
      { key: 'fecha_alerta', label: 'Fecha', render: (row) => formatDateTime(getFirstValue(row, ['fecha_alerta', 'fecha'])) },
      { key: 'tipo_alerta', label: 'Tipo', render: (row) => getFirstValue(row, ['tipo_alerta', 'tipo', 'nivel'], '-') },
      { key: 'mensaje', label: 'Mensaje', render: (row) => getFirstValue(row, ['mensaje', 'descripcion'], '-') },
    ],
    logs: [
      { key: 'proceso', label: 'Proceso', render: (row) => getFirstValue(row, ['proceso', 'job', 'tabla'], '-') },
      { key: 'inicio', label: 'Inicio', render: (row) => formatDateTime(getFirstValue(row, ['inicio', 'fecha_inicio', 'fecha'])) },
      { key: 'estado', label: 'Estado', render: (row) => <span className="status">{getFirstValue(row, ['estado', 'status'], '-')}</span> },
    ],
    errores: [
      { key: 'fecha', label: 'Fecha', render: (row) => formatDateTime(getFirstValue(row, ['fecha', 'created_at'])) },
      { key: 'error_desc', label: 'Error', render: (row) => getFirstValue(row, ['error_desc', 'error', 'mensaje'], '-') },
      { key: 'valores_fila', label: 'Valores', render: (row) => String(getFirstValue(row, ['valores_fila', 'fila', 'detalle'], '-')).slice(0, 46) },
    ],
  }), [])

  return (
    <main className={`executive-dashboard route-${route} ${filtersOpen ? '' : 'filters-collapsed'}`}>
      <nav className="dashboard-navbar">
        <div className="nav-brand">
          <span className="brand-mark"><LayoutDashboard size={18} /></span>
          <div>
            <strong>TechStore360</strong>
            <small>Dashboard ejecutivo</small>
          </div>
        </div>
        <div className="nav-center">
          <button className={route === 'overview' ? 'active' : ''} type="button" onClick={() => navigate('overview')}>Overview</button>
          <button className={route === 'ventas' ? 'active' : ''} type="button" onClick={() => navigate('ventas')}>Ventas</button>
          <button className={route === 'etl' ? 'active' : ''} type="button" onClick={() => navigate('etl')}>ETL</button>
        </div>
        <div className="nav-actions">
          <button className="icon-button" type="button" onClick={() => setFiltersOpen((current) => !current)} aria-label={filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}>
            {filtersOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <button className="refresh-button" type="button" onClick={refetch} disabled={refreshing}>
            <RefreshCcw size={17} className={refreshing ? 'spin' : ''} />
            Actualizar
          </button>
          <button className="logout-button" type="button" onClick={onLogout} aria-label="Cerrar sesión">
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-shell">
        {filtersOpen && (
          <aside className="dashboard-sidebar">
            <div className="sidebar-title">
              <div>
                <span className="eyebrow">Filtros</span>
                <strong>Segmentación</strong>
              </div>
              <button className="icon-button" type="button" onClick={() => setFiltersOpen(false)} aria-label="Ocultar filtros">
                <Menu size={17} />
              </button>
            </div>
            <FiltersPanel appliedFilters={filters} onApply={setFilters} onClear={() => setFilters({})} />
          </aside>
        )}

        <section className="dashboard-content">
          <header className="content-header">
            <div>
              <span className="eyebrow">TechStore360 BI</span>
              <h1>{route === 'ventas' ? 'Ventas' : route === 'etl' ? 'ETL' : 'Dashboard ejecutivo'}</h1>
            </div>
          </header>

          <ErrorBanner errors={errors} />

          {route === 'ventas' ? (
            <SalesRouteDashboard
              model={model}
              loading={loading}
              tableColumns={tableColumns}
              filters={filters}
            />
          ) : route === 'etl' ? (
            <EtlDashboard
              data={data}
              loading={loading}
              tableColumns={tableColumns}
              onDetail={setDetail}
            />
          ) : (
            <>
              <KpiGrid kpis={model.kpis} loading={loading} />

              <ChartsGrid model={model} loading={loading} filters={filters} />

              <div className="tables-grid">
                <VipCustomersPanel rows={model.clientesVip} loading={loading} onDetail={setDetail} />
                <CriticalStockPanel rows={model.stockCritico} loading={loading} onDetail={setDetail} />
                <OperationalAlertsPanel rows={data.alertas} loading={loading} onDetail={setDetail} />
              </div>
            </>
          )}
        </section>
      </div>

      <DetailModal detail={detail} onClose={() => setDetail(null)} />
    </main>
  )
}

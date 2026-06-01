export function buildQueryParams(obj = {}) {
  // Allow only the filter keys the backend expects
  const allowed = new Set([
    'fecha_inicio', 'fecha_fin', 'anio', 'mes', 'id_sucursal', 'id_producto', 'id_cliente', 'id_vendedor', 'id_metodo_pago', 'categoria',
    // pagination / misc commonly used
    'limit', 'limite', 'offset', 'page', 'page_size', 'search',
  ])

  const entries = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .filter(([k]) => allowed.has(k))

  if (!entries.length) return ''
  const qs = new URLSearchParams()
  for (const [k, v] of entries) qs.set(k, String(v))
  return `?${qs.toString()}`
}

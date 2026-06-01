import { useEffect, useState } from 'react'
import { useFilters } from '../../hooks/useFilters'
import { AsyncComboBox } from '../common/AsyncComboBox'
import { getClientes, getProductos, getSucursales } from '../../services/api'

export default function GlobalFilters({ onChange, onClear }) {
  const { filters, set, clear, options, loading } = useFilters()
  const [local, setLocal] = useState(filters)

  useEffect(() => setLocal(filters), [filters])

  function apply() {
    // remove empty values before applying
    const payload = Object.fromEntries(Object.entries(local).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    onChange(payload)
    set(payload)
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="grid grid-cols-2 gap-3">
        <select value={local.anio} onChange={(e) => setLocal((s) => ({ ...s, anio: e.target.value }))}>
          <option value="">Año</option>
          {(options?.anios || []).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={local.mes} onChange={(e) => setLocal((s) => ({ ...s, mes: e.target.value }))}>
          <option value="">Mes</option>
          {(options?.meses || []).map((m) => <option key={m.mes} value={m.mes}>{m.nombre_mes}</option>)}
        </select>

        <AsyncComboBox
          label="Cliente"
          value={local.id_cliente || null}
          onChange={v => setLocal(s => ({ ...s, id_cliente: v }))}
          fetchOptions={async (search) => {
            const res = await getClientes({ search, page: 1, page_size: 20 });
            return (res?.results || res || []).map(c => ({ value: c.id_cliente || c.id, label: c.nombre, subtitle: c.cuit || undefined }));
          }}
          placeholder="Buscar cliente..."
        />

        <AsyncComboBox
          label="Producto"
          value={local.id_producto || null}
          onChange={v => setLocal(s => ({ ...s, id_producto: v }))}
          fetchOptions={async (search) => {
            const res = await getProductos({ search, page: 1, page_size: 20 });
            return (res?.results || res || []).map(p => ({ value: p.id_producto || p.id, label: p.nombre, subtitle: p.sku || undefined }));
          }}
          placeholder="Buscar producto..."
        />

        <select value={local.categoria} onChange={(e) => setLocal((s) => ({ ...s, categoria: e.target.value }))}>
          <option value="">Categoría</option>
          {(options?.categorias || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <AsyncComboBox
          label="Sucursal"
          value={local.id_sucursal || null}
          onChange={v => setLocal(s => ({ ...s, id_sucursal: v }))}
          fetchOptions={async (search) => {
            const res = await getSucursales({ search, page: 1, page_size: 20 });
            return (res?.results || res || []).map(suc => ({ value: suc.id_sucursal || suc.id, label: suc.nombre, subtitle: suc.direccion || undefined }));
          }}
          placeholder="Buscar sucursal..."
        />

        <select value={local.id_vendedor} onChange={(e) => setLocal((s) => ({ ...s, id_vendedor: e.target.value }))}>
          <option value="">Vendedor</option>
          {(options?.vendedores || []).map((v) => (
            <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>
          ))}
        </select>

        <select value={local.id_metodo_pago} onChange={(e) => setLocal((s) => ({ ...s, id_metodo_pago: e.target.value }))}>
          <option value="">Método de pago</option>
          {(options?.metodos_pago || []).map((m) => (
            <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.metodo_pago}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={apply} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button>
        <button onClick={() => { clear(); setLocal({ anio: '', mes: '', id_cliente: '', id_producto: '', categoria: '', id_sucursal: '', id_vendedor: '', id_metodo_pago: '' }); onClear(); }} className="px-3 py-1 bg-gray-100 rounded">Limpiar</button>
      </div>
      {loading && <div className="text-sm text-gray-500 mt-2">Cargando filtros...</div>}
    </div>
  )
}

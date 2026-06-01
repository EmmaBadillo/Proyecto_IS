import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getVentas } from '../../services/api'
import DataTable from './DataTable'
import Pagination from '../ui/Pagination'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function SalesTable({ filters }) {
  const { data, loading, error } = useApi(() => getVentas(filters), [JSON.stringify(filters)])
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : []
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const start = (page - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const columns = [
    { key: 'fecha', title: 'Fecha', render: (r) => formatDate(r.fecha) },
    { key: 'id_venta_odoo', title: 'Venta Odoo' },
    { key: 'cliente', title: 'Cliente' },
    { key: 'cedula', title: 'Cédula' },
    { key: 'ciudad', title: 'Ciudad' },
    { key: 'producto', title: 'Producto' },
    { key: 'categoria', title: 'Categoría' },
    { key: 'proveedor', title: 'Proveedor' },
    { key: 'vendedor', title: 'Vendedor' },
    { key: 'sucursal', title: 'Sucursal' },
    { key: 'metodo_pago', title: 'Método de pago' },
    { key: 'cantidad', title: 'Cantidad' },
    { key: 'precio_unitario', title: 'Precio unitario', render: (r) => formatCurrency(r.precio_unitario) },
    { key: 'subtotal', title: 'Subtotal', render: (r) => formatCurrency(r.subtotal) },
    { key: 'iva', title: 'IVA', render: (r) => formatCurrency(r.iva) },
    { key: 'total', title: 'Total', render: (r) => formatCurrency(r.total) },
  ]

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error cargando ventas</div>
  if (!rows.length) return <div className="text-gray-500">Sin ventas</div>

  return (
    <div>
      <DataTable columns={columns} data={pageRows} />
      <div className="mt-2 flex items-center justify-between">
        <div>
          <label className="text-sm mr-2">Mostrar:</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div><Pagination page={page} total={rows.length} onChange={setPage} /></div>
      </div>
    </div>
  )
}

import { useApi } from '../../hooks/useApi'
import { getLowStock } from '../../services/api'
import DataTable from './DataTable'

export default function LowStockTable({ limite = 5 }) {
  const { data, loading, error } = useApi(() => getLowStock(limite), [limite])
  const rows = data || []

  const columns = [
    { key: 'producto', title: 'Producto' },
    { key: 'categoria', title: 'Categoría' },
    { key: 'stock', title: 'Stock' },
  ]

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin items</div>

  return <DataTable columns={columns} data={rows} />
}

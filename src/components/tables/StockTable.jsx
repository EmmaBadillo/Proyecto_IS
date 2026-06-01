import { useApi } from '../../hooks/useApi'
import { getStock } from '../../services/api'
import DataTable from './DataTable'
import Badge from '../ui/Badge'

export default function StockTable({ filters }) {
  const { data, loading, error } = useApi(() => getStock(filters), [JSON.stringify(filters)])
  const rows = data || []

  const columns = [
    { key: 'producto', title: 'Producto' },
    { key: 'categoria', title: 'Categoría' },
    { key: 'stock', title: 'Stock', render: (r) => (
      <div className="flex items-center gap-2">{r.stock <= 5 ? <Badge color="red">Bajo stock</Badge> : <Badge color="green">Disponible</Badge>}<span>{r.stock}</span></div>
    ) },
  ]

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error cargando stock</div>
  if (!rows.length) return <div className="text-gray-500">Sin stock</div>

  return <DataTable columns={columns} data={rows} />
}

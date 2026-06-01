import { useApi } from '../../hooks/useApi'
import { getErrores } from '../../services/api'
import DataTable from './DataTable'
import { formatDate } from '../../utils/formatDate'

export default function ErrorsTable({ filters }) {
  const { data, loading, error } = useApi(() => getErrores(filters), [JSON.stringify(filters)])
  const rows = data || []
  const columns = [
    { key: 'fecha', title: 'Fecha', render: (r) => formatDate(r.fecha) },
    { key: 'error_desc', title: 'Error' },
    { key: 'valores_fila', title: 'Valores fila' },
  ]

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin errores</div>

  return <DataTable columns={columns} data={rows} />
}

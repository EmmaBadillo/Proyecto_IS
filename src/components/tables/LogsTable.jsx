import { useApi } from '../../hooks/useApi'
import { getLogs } from '../../services/api'
import DataTable from './DataTable'
import { formatDate } from '../../utils/formatDate'

export default function LogsTable({ filters }) {
  const { data, loading, error } = useApi(() => getLogs(filters), [JSON.stringify(filters)])
  const rows = data || []
  const columns = [
    { key: 'proceso', title: 'Proceso' },
    { key: 'inicio', title: 'Inicio', render: (r) => formatDate(r.inicio) },
    { key: 'fin', title: 'Fin', render: (r) => (r.fin ? formatDate(r.fin) : 'No registrado') },
    { key: 'estado', title: 'Estado' },
  ]

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin logs</div>

  return <DataTable columns={columns} data={rows} />
}

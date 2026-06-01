import { useApi } from '../../hooks/useApi'
import { getAlertas } from '../../services/api'
import DataTable from './DataTable'
import { formatDate } from '../../utils/formatDate'

export default function AlertsTable({ filters }) {
  const { data, loading, error } = useApi(() => getAlertas(filters), [JSON.stringify(filters)])
  const rows = data || []
  const columns = [
    { key: 'fecha_alerta', title: 'Fecha alerta', render: (r) => formatDate(r.fecha_alerta) },
    { key: 'tipo_alerta', title: 'Tipo' },
    { key: 'mensaje', title: 'Mensaje' },
    { key: 'producto', title: 'Producto' },
    { key: 'sucursal', title: 'Sucursal' },
    { key: 'cliente', title: 'Cliente' },
  ]

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error</div>
  if (!rows.length) return <div className="text-gray-500">Sin alertas</div>

  return <DataTable columns={columns} data={rows} />
}

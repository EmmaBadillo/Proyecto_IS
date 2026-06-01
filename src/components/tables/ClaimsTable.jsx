import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { getReclamos } from '../../services/api'
import Loader from '../ui/Loader'

export default function ClaimsTable({ filters, initialPage = 1, pageSize = 10 }) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(pageSize)

  const { data, loading, error, refetch } = useApi(() => getReclamos({ ...filters, page, limit }), [JSON.stringify(filters), page, limit])

  // normalize
  const rows = (data && (Array.isArray(data.data) ? data.data : data.data ?? [])) || []
  const total = data?.total_registros ?? (Array.isArray(data) ? data.length : rows.length)

  useEffect(() => {
    // reset to page 1 when filters change
    setPage(1)
  }, [JSON.stringify(filters)])

  if (loading) return <Loader />
  if (error) return <div className="text-red-600">Error al cargar reclamos</div>
  if (!rows.length) return <div className="text-gray-500">No hay reclamos</div>

  const totalPages = Math.max(1, Math.ceil((total || rows.length) / limit))

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h4 className="mb-2">Detalle de reclamos</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id_reclamo || r.id || JSON.stringify(r)}>
                <td>{r.fecha || r.date || ''}</td>
                <td>{r.cliente || r.nombre_cliente || r.customer || ''}</td>
                <td>{r.producto || r.nombre_producto || r.product || ''}</td>
                <td>{r.categoria || r.category || ''}</td>
                <td>{r.descripcion || r.description || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">Mostrando página {page} de {totalPages} — {total} reclamos</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 bg-gray-100 rounded">Anterior</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-2 py-1 bg-gray-100 rounded">Siguiente</button>
        </div>
      </div>
    </div>
  )
}


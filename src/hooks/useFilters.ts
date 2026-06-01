import { useEffect, useState } from 'react'
import { getFiltros } from '../services/api'

type FilterState = {
  anio: string
  mes: string
  id_cliente: string
  id_producto: string
  categoria: string
  id_sucursal: string
  id_vendedor: string
  id_metodo_pago: string
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    anio: '',
    mes: '',
    id_cliente: '',
    id_producto: '',
    categoria: '',
    id_sucursal: '',
    id_vendedor: '',
    id_metodo_pago: '',
  })
  const [options, setOptions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getFiltros()
      .then((res) => { if (mounted) setOptions(res.data ?? res) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const set = (partial: Partial<FilterState>) => setFilters((s) => ({ ...s, ...partial }))
  const clear = () => setFilters({ anio: '', mes: '', id_cliente: '', id_producto: '', categoria: '', id_sucursal: '', id_vendedor: '', id_metodo_pago: '' })

  return { filters, set, clear, options, loading, error }
}

import { useEffect, useState, useCallback } from 'react'

export function useApi<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    void execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}

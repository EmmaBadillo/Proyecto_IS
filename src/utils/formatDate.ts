export function formatDate(value: unknown) {
  if (!value) return ''
  const d = new Date(value as string | number | Date)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

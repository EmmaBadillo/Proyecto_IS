export function formatCurrency(value) {
  const amount = Number(value)
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatNumber(value) {
  const amount = Number(value)
  return new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatPercent(value) {
  const amount = Number(value)
  return new Intl.NumberFormat('es-EC', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount / 100 : 0)
}

export function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value) {
  if (!value) return 'Sin registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

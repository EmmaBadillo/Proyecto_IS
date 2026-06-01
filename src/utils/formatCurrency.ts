export function formatCurrency(value: unknown) {
  if (value == null) return '$0.00'
  const num = Number(value) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

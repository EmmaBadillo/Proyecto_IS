export default function Badge({ children, color = 'gray' }) {
  const colors = {
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  }
  return <span className={`px-2 py-0.5 rounded text-xs ${colors[color] || colors.gray}`}>{children}</span>
}

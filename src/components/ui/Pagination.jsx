export default function Pagination({ page, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / 10))
  return (
    <div className="flex items-center gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-2 py-1 bg-gray-100 rounded">Prev</button>
      <span className="text-sm">{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="px-2 py-1 bg-gray-100 rounded">Next</button>
    </div>
  )
}

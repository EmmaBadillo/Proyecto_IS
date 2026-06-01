export default function DataTable({ columns = [], data = [] }) {
  return (
    <div className="overflow-auto bg-white rounded shadow">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => <th key={c.key} className="p-2 text-left">{c.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => <td key={c.key} className="p-2">{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

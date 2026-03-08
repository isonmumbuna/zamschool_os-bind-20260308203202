'use client'

export default function Table({ columns, data, loading, emptyMessage = 'No data found' }) {
  if (loading) return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200"><tr>{columns.map(c => <th key={c.key} className="table-th">{c.label}</th>)}</tr></thead>
        <tbody>{[...Array(5)].map((_, i) => <tr key={i} className="border-b border-gray-100">{columns.map(c => <td key={c.key} className="table-td"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)}</tbody>
      </table>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200"><tr>{columns.map(c => <th key={c.key} className="table-th">{c.label}</th>)}</tr></thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-400">{emptyMessage}</td></tr>
            : data.map((row, i) => (
              <tr key={row.id || i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {columns.map(c => <td key={c.key} className="table-td">{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

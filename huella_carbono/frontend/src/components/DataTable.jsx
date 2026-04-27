import { Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, data, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-carbon-200">
        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mr-3" />
        Cargando...
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="text-center py-12 text-carbon-200">
        <p className="text-sm">No hay registros aún. Agrega el primero.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-carbon-200">
      <table className="w-full text-sm">
        <thead className="bg-carbon-50 border-b border-carbon-200">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-carbon-200 uppercase tracking-wide">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="text-right px-4 py-3 text-xs font-semibold text-carbon-200 uppercase tracking-wide">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-carbon-200">
          {data.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-carbon-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-carbon-800">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg text-carbon-200 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)}
                        className="p-1.5 rounded-lg text-carbon-200 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

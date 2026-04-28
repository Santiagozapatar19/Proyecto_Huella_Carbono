import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save, Loader2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/FormField'
import { createCompras, updateCompras, getPeriodos } from '../../services/recoleccion'

const CATEGORIAS = [
  { value: 'papel',       label: 'Papel y materiales de oficina' },
  { value: 'plasticos',   label: 'Plásticos' },
  { value: 'quimicos',    label: 'Químicos e insumos industriales' },
  { value: 'alimentos',   label: 'Alimentos y bebidas' },
  { value: 'electronico', label: 'Equipos electrónicos' },
  { value: 'otro',        label: 'Otro' },
]

const EMPTY = { periodo: '', categoria: 'papel', descripcion: '', proveedor: '', cantidad: '',
                unidad: 'kg', peso_total_kg: '', costo_cop: '', area: '', origen_nacional: true, observaciones: '' }

export default function FormCompras({ registro, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(registro ? { ...registro } : EMPTY)

  const { data: periodosData } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => getPeriodos().then(r => r.data.results || r.data),
  })
  const periodoOptions = (periodosData || []).filter(p => !p.cerrado)
    .map(p => ({ value: p.id, label: p.label }))

  const mutation = useMutation({
    mutationFn: (data) => registro ? updateCompras(registro.id, data) : createCompras(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compras'] }); toast.success('Guardado'); onClose() },
    onError: () => toast.error('Error al guardar'),
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.periodo || !form.descripcion || !form.cantidad) return toast.error('Completa los campos requeridos')
    mutation.mutate({
      ...form,
      cantidad: Number(form.cantidad),
      peso_total_kg: form.peso_total_kg ? Number(form.peso_total_kg) : null,
      costo_cop: form.costo_cop ? Number(form.costo_cop) : null,
      origen_nacional: form.origen_nacional === true || form.origen_nacional === 'true',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <h2 className="text-lg font-semibold">{registro ? 'Editar' : 'Nuevo'} Registro de Compras</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-carbon-100"><X className="w-5 h-5 text-carbon-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Período" required value={form.periodo} onChange={set('periodo')} options={periodoOptions} placeholder="Selecciona..." />
            <Select label="Categoría" required value={form.categoria} onChange={set('categoria')} options={CATEGORIAS} />
          </div>
          <Input label="Descripción del artículo" required value={form.descripcion} onChange={set('descripcion')} placeholder="Resmas papel bond, bidones aceite..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Proveedor" value={form.proveedor} onChange={set('proveedor')} />
            <Input label="Área" value={form.area} onChange={set('area')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cantidad" required type="number" min="0" step="0.001" value={form.cantidad} onChange={set('cantidad')} />
            <Input label="Unidad" required value={form.unidad} onChange={set('unidad')} placeholder="kg, litros, unid..." />
            <Input label="Peso total (kg)" type="number" min="0" step="0.001" value={form.peso_total_kg} onChange={set('peso_total_kg')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Costo (COP)" type="number" min="0" value={form.costo_cop} onChange={set('costo_cop')} />
            <Select label="Origen" value={form.origen_nacional} onChange={set('origen_nacional')}
              options={[{ value: true, label: 'Nacional' }, { value: false, label: 'Importado' }]} />
          </div>
          <Textarea label="Observaciones" value={form.observaciones} onChange={set('observaciones')} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {registro ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save, Loader2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/FormField'
import { createResiduos, updateResiduos, getPeriodos } from '../../services/recoleccion'

const TIPOS = [
  { value: 'ordinario',  label: 'Ordinario / No reciclable' },
  { value: 'reciclable', label: 'Reciclable' },
  { value: 'organico',   label: 'Orgánico' },
  { value: 'peligroso',  label: 'Peligroso (RESPEL)' },
  { value: 'especial',   label: 'Especial (RAEE, escombros...)' },
]
const METODOS = [
  { value: 'relleno',           label: 'Relleno sanitario' },
  { value: 'reciclaje',         label: 'Reciclaje' },
  { value: 'compostaje',        label: 'Compostaje' },
  { value: 'incineracion',      label: 'Incineración' },
  { value: 'gestor_autorizado', label: 'Gestor autorizado RESPEL' },
  { value: 'otro',              label: 'Otro' },
]

const EMPTY = { periodo: '', tipo_residuo: 'ordinario', descripcion: '', area: '', sede: '',
                cantidad_kg: '', metodo_disposicion: 'relleno', gestor_externo: '',
                costo_disposicion_cop: '', observaciones: '' }

export default function FormResiduos({ registro, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(registro ? { ...registro } : EMPTY)

  const { data: periodosData } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => getPeriodos().then(r => r.data.results || r.data),
  })
  const periodoOptions = (periodosData || []).filter(p => !p.cerrado)
    .map(p => ({ value: p.id, label: p.label }))

  const mutation = useMutation({
    mutationFn: (data) => registro ? updateResiduos(registro.id, data) : createResiduos(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['residuos'] }); toast.success('Guardado'); onClose() },
    onError: () => toast.error('Error al guardar'),
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.periodo || !form.cantidad_kg) return toast.error('Completa los campos requeridos')
    mutation.mutate({
      ...form,
      cantidad_kg: Number(form.cantidad_kg),
      costo_disposicion_cop: form.costo_disposicion_cop ? Number(form.costo_disposicion_cop) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <h2 className="text-lg font-semibold">{registro ? 'Editar' : 'Nuevo'} Registro de Residuos</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-carbon-100"><X className="w-5 h-5 text-carbon-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Período" required value={form.periodo} onChange={set('periodo')} options={periodoOptions} placeholder="Selecciona..." />
            <Select label="Tipo de residuo" required value={form.tipo_residuo} onChange={set('tipo_residuo')} options={TIPOS} />
          </div>
          <Input label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Cartón, plástico PET, aceite usado..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Área" value={form.area} onChange={set('area')} placeholder="Producción, Bodega..." />
            <Input label="Sede" value={form.sede} onChange={set('sede')} placeholder="Sede principal..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cantidad (kg)" required type="number" min="0" step="0.001" value={form.cantidad_kg} onChange={set('cantidad_kg')} placeholder="0.000" />
            <Select label="Método de disposición" required value={form.metodo_disposicion} onChange={set('metodo_disposicion')} options={METODOS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Gestor externo" value={form.gestor_externo} onChange={set('gestor_externo')} placeholder="Nombre del gestor..." />
            <Input label="Costo disposición (COP)" type="number" min="0" value={form.costo_disposicion_cop} onChange={set('costo_disposicion_cop')} />
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

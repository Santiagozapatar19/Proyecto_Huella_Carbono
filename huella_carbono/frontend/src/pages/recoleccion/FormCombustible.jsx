import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save, Loader2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/FormField'
import { createCombustible, updateCombustible, getPeriodos } from '../../services/recoleccion'

const TIPOS_COMBUSTIBLE = [
  { value: 'diesel',       label: 'Diésel' },
  { value: 'gasolina',     label: 'Gasolina' },
  { value: 'gas_natural_v',label: 'Gas Natural Vehicular' },
  { value: 'biodiesel',    label: 'Biodiésel' },
  { value: 'otro',         label: 'Otro' },
]
const TIPOS_VEHICULO = [
  { value: 'camion', label: 'Camión' },
  { value: 'furgon', label: 'Furgón' },
  { value: 'auto',   label: 'Automóvil' },
  { value: 'moto',   label: 'Motocicleta' },
  { value: 'otro',   label: 'Otro' },
]

const EMPTY = { periodo: '', tipo_combustible: 'diesel', tipo_vehiculo: '', placa_o_equipo: '',
                area: '', cantidad_litros: '', costo_cop: '', proveedor: '', observaciones: '' }

export default function FormCombustible({ registro, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(registro ? {
    periodo: registro.periodo, tipo_combustible: registro.tipo_combustible,
    tipo_vehiculo: registro.tipo_vehiculo || '', placa_o_equipo: registro.placa_o_equipo || '',
    area: registro.area || '', cantidad_litros: registro.cantidad_litros,
    costo_cop: registro.costo_cop || '', proveedor: registro.proveedor || '',
    observaciones: registro.observaciones || '',
  } : EMPTY)

  const { data: periodosData } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => getPeriodos().then(r => r.data.results || r.data),
  })
  const periodoOptions = (periodosData || []).filter(p => !p.cerrado)
    .map(p => ({ value: p.id, label: p.label }))

  const mutation = useMutation({
    mutationFn: (data) => registro ? updateCombustible(registro.id, data) : createCombustible(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['combustible'] })
      toast.success(registro ? 'Registro actualizado' : 'Registro creado')
      onClose()
    },
    onError: () => toast.error('Error al guardar'),
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.periodo || !form.cantidad_litros) return toast.error('Completa los campos requeridos')
    mutation.mutate({ ...form, cantidad_litros: Number(form.cantidad_litros), costo_cop: form.costo_cop ? Number(form.costo_cop) : null })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <h2 className="text-lg font-semibold">{registro ? 'Editar' : 'Nuevo'} Registro de Combustible</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-carbon-100"><X className="w-5 h-5 text-carbon-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Período" required value={form.periodo} onChange={set('periodo')} options={periodoOptions} placeholder="Selecciona..." />
            <Select label="Tipo combustible" required value={form.tipo_combustible} onChange={set('tipo_combustible')} options={TIPOS_COMBUSTIBLE} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo vehículo" value={form.tipo_vehiculo} onChange={set('tipo_vehiculo')} options={TIPOS_VEHICULO} placeholder="Selecciona..." />
            <Input label="Placa / Equipo" value={form.placa_o_equipo} onChange={set('placa_o_equipo')} placeholder="ABC-123 / EQ-001" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Área" value={form.area} onChange={set('area')} placeholder="Logística, Producción..." />
            <Input label="Proveedor" value={form.proveedor} onChange={set('proveedor')} placeholder="Terpel, Biomax..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Litros consumidos" required type="number" min="0" step="0.01" value={form.cantidad_litros} onChange={set('cantidad_litros')} placeholder="0.00" />
            <Input label="Costo (COP)" type="number" min="0" value={form.costo_cop} onChange={set('costo_cop')} placeholder="0" />
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

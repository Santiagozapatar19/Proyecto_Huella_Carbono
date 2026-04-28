import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save, Loader2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../components/FormField'
import { createEnergia, updateEnergia, getPeriodos } from '../../services/recoleccion'

const TIPOS_ENERGIA = [
  { value: 'electrica',   label: 'Eléctrica (Red)' },
  { value: 'solar',       label: 'Solar' },
  { value: 'gas_natural', label: 'Gas Natural' },
  { value: 'glp',         label: 'GLP (Propano/Butano)' },
  { value: 'otro',        label: 'Otro' },
]

const EMPTY = { periodo: '', tipo_energia: 'electrica', sede: '', area: '',
                consumo_kwh: '', costo_cop: '', proveedor: '', numero_factura: '', observaciones: '' }

export default function FormEnergia({ registro, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(registro ? {
    periodo: registro.periodo, tipo_energia: registro.tipo_energia,
    sede: registro.sede, area: registro.area || '',
    consumo_kwh: registro.consumo_kwh, costo_cop: registro.costo_cop || '',
    proveedor: registro.proveedor || '', numero_factura: registro.numero_factura || '',
    observaciones: registro.observaciones || '',
  } : EMPTY)

  const { data: periodosData } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => getPeriodos().then(r => r.data.results || r.data),
  })

  const periodoOptions = (periodosData || [])
    .filter(p => !p.cerrado)
    .map(p => ({ value: p.id, label: p.label }))

  const mutation = useMutation({
    mutationFn: (data) => registro ? updateEnergia(registro.id, data) : createEnergia(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['energia'] })
      toast.success(registro ? 'Registro actualizado' : 'Registro creado exitosamente')
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error al guardar'),
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.periodo) return toast.error('Selecciona un período')
    if (!form.sede)    return toast.error('Ingresa la sede')
    if (!form.consumo_kwh || Number(form.consumo_kwh) <= 0) return toast.error('El consumo debe ser mayor a 0')
    mutation.mutate({
      ...form,
      consumo_kwh: Number(form.consumo_kwh),
      costo_cop: form.costo_cop ? Number(form.costo_cop) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <h2 className="text-lg font-semibold text-carbon-800">
            {registro ? 'Editar' : 'Nuevo'} Registro de Energía
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-carbon-100 transition-colors">
            <X className="w-5 h-5 text-carbon-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Período" required value={form.periodo} onChange={set('periodo')}
              options={periodoOptions} placeholder="Selecciona período..." />
            <Select label="Tipo de energía" required value={form.tipo_energia} onChange={set('tipo_energia')}
              options={TIPOS_ENERGIA} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Sede" required value={form.sede} onChange={set('sede')} placeholder="Sede principal, Bodega norte..." />
            <Input label="Área (opcional)" value={form.area} onChange={set('area')} placeholder="Producción, Administrativo..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Consumo (kWh)" required type="number" min="0" step="0.01"
              value={form.consumo_kwh} onChange={set('consumo_kwh')} placeholder="0.00" />
            <Input label="Costo (COP)" type="number" min="0" step="1"
              value={form.costo_cop} onChange={set('costo_cop')} placeholder="0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Proveedor" value={form.proveedor} onChange={set('proveedor')} placeholder="EPM, Celsia..." />
            <Input label="Nro. Factura" value={form.numero_factura} onChange={set('numero_factura')} placeholder="FAC-2024-001" />
          </div>

          <Textarea label="Observaciones" value={form.observaciones} onChange={set('observaciones')}
            placeholder="Notas adicionales..." />

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

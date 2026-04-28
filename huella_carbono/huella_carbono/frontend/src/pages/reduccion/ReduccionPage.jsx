import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Target, Plus, ChevronDown, ChevronUp, Loader2, Save,
  X, Play, CheckCircle, AlertTriangle, Clock, XCircle,
  Zap, Fuel, Truck, Package, Trash2, Layers, Bell,
} from 'lucide-react'
import {
  getPlanes, createPlan, getIniciativas, createIniciativa,
  cambiarEstado, getAlertasActivas, resolverAlerta, verificarAlertas,
  getProgreso,
} from '../../services/reduccion'
import { getCalculos } from '../../services/calculo'
import { Input, Select, Textarea } from '../../components/FormField'

// ── Paleta ────────────────────────────────────────────────────────
const FUENTE_ICON = { energia: Zap, combustible: Fuel, logistica: Truck, compras: Package, residuos: Trash2, multiple: Layers }
const FUENTE_COLOR= { energia:'text-yellow-600 bg-yellow-50', combustible:'text-orange-600 bg-orange-50', logistica:'text-blue-600 bg-blue-50', compras:'text-purple-600 bg-purple-50', residuos:'text-red-600 bg-red-50', multiple:'text-carbon-600 bg-carbon-50' }
const ESTADO_BADGE= { pendiente:'bg-carbon-100 text-carbon-200', en_curso:'bg-blue-100 text-blue-700', completada:'bg-green-100 text-green-700', cancelada:'bg-red-100 text-red-500' }
const ESTADO_ICON = { pendiente: Clock, en_curso: Play, completada: CheckCircle, cancelada: XCircle }

const OPCIONES_FUENTE = [
  {value:'energia',label:'Energía'},{value:'combustible',label:'Combustible'},
  {value:'logistica',label:'Logística'},{value:'compras',label:'Compras'},
  {value:'residuos',label:'Residuos'},{value:'multiple',label:'Múltiples fuentes'},
]
const OPCIONES_PUNTAJE = [{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'}]

const fmt = (n,d=3) => Number(n||0).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d})
const fmtCOP = n => n ? `$${Number(n).toLocaleString('es-CO')}` : '—'

// ── Modal Plan ────────────────────────────────────────────────────
function ModalPlan({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ nombre:'', descripcion:'', anio_objetivo: new Date().getFullYear()+1,
    meta_reduccion_pct:'', linea_base_tco2e:'', fecha_inicio:'', fecha_fin:'', estado:'borrador' })
  const { data: calculos } = useQuery({ queryKey:['calculos'], queryFn: () => getCalculos().then(r=>r.data.results||r.data) })

  const mutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => { qc.invalidateQueries({queryKey:['planes']}); toast.success('Plan creado'); onClose() },
    onError: () => toast.error('Error al crear el plan'),
  })

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.nombre || !form.meta_reduccion_pct || !form.linea_base_tco2e || !form.fecha_inicio || !form.fecha_fin)
      return toast.error('Completa todos los campos requeridos')
    mutation.mutate({...form, anio_objetivo: Number(form.anio_objetivo), meta_reduccion_pct: Number(form.meta_reduccion_pct), linea_base_tco2e: Number(form.linea_base_tco2e)})
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <h2 className="text-lg font-semibold">Nuevo Plan de Reducción</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-carbon-100"><X className="w-5 h-5 text-carbon-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Nombre del plan" required value={form.nombre} onChange={set('nombre')} placeholder="Plan de reducción 2025" />
          <Textarea label="Descripción" value={form.descripcion} onChange={set('descripcion')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Año objetivo" required type="number" value={form.anio_objetivo} onChange={set('anio_objetivo')} />
            <Input label="Meta de reducción (%)" required type="number" min="0" max="100" step="0.1" value={form.meta_reduccion_pct} onChange={set('meta_reduccion_pct')} placeholder="15" />
          </div>
          <div>
            <label className="label">Línea base tCO₂e <span className="text-red-500">*</span></label>
            <select className="input" value={form.linea_base_tco2e} onChange={set('linea_base_tco2e')}>
              <option value="">— Selecciona un cálculo existente —</option>
              {(calculos||[]).map(c => <option key={c.id} value={c.total_tco2e}>{c.periodo_label} — {fmt(c.total_tco2e)} tCO₂e</option>)}
            </select>
            <p className="text-xs text-carbon-200 mt-1">O ingresa manualmente:</p>
            <input type="number" min="0" step="0.001" className="input mt-1" placeholder="tCO₂e" value={form.linea_base_tco2e} onChange={set('linea_base_tco2e')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha inicio" required type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} />
            <Input label="Fecha fin" required type="date" value={form.fecha_fin} onChange={set('fecha_fin')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Crear plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Iniciativa ──────────────────────────────────────────────
function ModalIniciativa({ planId, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    plan: planId, nombre:'', descripcion:'', fuente_impacto:'energia',
    area:'', sede:'', impacto:'3', factibilidad:'3', costo_estimado_cop:'',
    reduccion_estimada_tco2e:'', fecha_inicio_plan:'', fecha_fin_plan:'',
  })
  const mutation = useMutation({
    mutationFn: createIniciativa,
    onSuccess: () => { qc.invalidateQueries({queryKey:['iniciativas']}); toast.success('Iniciativa creada'); onClose() },
    onError: () => toast.error('Error al crear iniciativa'),
  })
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))
  const handleSubmit = e => {
    e.preventDefault()
    if (!form.nombre || !form.descripcion || !form.reduccion_estimada_tco2e || !form.fecha_inicio_plan || !form.fecha_fin_plan)
      return toast.error('Completa todos los campos requeridos')
    mutation.mutate({...form, impacto: Number(form.impacto), factibilidad: Number(form.factibilidad),
      reduccion_estimada_tco2e: Number(form.reduccion_estimada_tco2e),
      costo_estimado_cop: form.costo_estimado_cop ? Number(form.costo_estimado_cop) : null })
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <h2 className="text-lg font-semibold">Nueva Iniciativa</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-carbon-100"><X className="w-5 h-5 text-carbon-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Nombre de la iniciativa" required value={form.nombre} onChange={set('nombre')} placeholder="Instalación de iluminación LED en bodega" />
          <Textarea label="Descripción" required value={form.descripcion} onChange={set('descripcion')} placeholder="Describir la acción, el alcance y cómo reduce emisiones..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Fuente de impacto" required value={form.fuente_impacto} onChange={set('fuente_impacto')} options={OPCIONES_FUENTE} />
            <Input label="Área" value={form.area} onChange={set('area')} placeholder="Producción, Bodega..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Impacto (1-5)" required value={form.impacto} onChange={set('impacto')} options={OPCIONES_PUNTAJE} />
            <Select label="Factibilidad (1-5)" required value={form.factibilidad} onChange={set('factibilidad')} options={OPCIONES_PUNTAJE} />
            <div>
              <label className="label">Score</label>
              <div className="input bg-carbon-50 flex items-center justify-center font-bold text-primary-600">
                {Number(form.impacto) * Number(form.factibilidad)} / 25
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Reducción estimada (tCO₂e)" required type="number" min="0" step="0.001" value={form.reduccion_estimada_tco2e} onChange={set('reduccion_estimada_tco2e')} placeholder="0.000" />
            <Input label="Costo estimado (COP)" type="number" min="0" value={form.costo_estimado_cop} onChange={set('costo_estimado_cop')} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha inicio plan" required type="date" value={form.fecha_inicio_plan} onChange={set('fecha_inicio_plan')} />
            <Input label="Fecha fin plan" required type="date" value={form.fecha_fin_plan} onChange={set('fecha_fin_plan')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Crear iniciativa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tarjeta Iniciativa ────────────────────────────────────────────
function TarjetaIniciativa({ ini }) {
  const qc = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const Icon = FUENTE_ICON[ini.fuente_impacto] || Layers
  const EstIcon = ESTADO_ICON[ini.estado] || Clock

  const estadoMutation = useMutation({
    mutationFn: ({estado, reduccion_real}) => cambiarEstado(ini.id, {estado, reduccion_real_tco2e: reduccion_real}),
    onSuccess: () => { qc.invalidateQueries({queryKey:['iniciativas']}); toast.success('Estado actualizado') },
  })

  return (
    <div className="border border-carbon-200 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-carbon-50" onClick={() => setAbierto(!abierto)}>
        <div className={`p-2 rounded-lg flex-shrink-0 ${FUENTE_COLOR[ini.fuente_impacto]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[ini.estado]}`}>{ini.estado.replace('_',' ')}</span>
            <span className="text-xs text-carbon-200">Score: <strong className="text-primary-600">{ini.score_priorizacion}/25</strong></span>
            <span className="text-xs text-carbon-200 ml-auto">{ini.reduccion_estimada_tco2e} tCO₂e est.</span>
          </div>
          <p className="font-medium text-carbon-800 mt-1 text-sm">{ini.nombre}</p>
          {ini.area && <p className="text-xs text-carbon-200">{ini.area}</p>}
          {/* Barra de avance */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-carbon-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{width:`${ini.avance_pct}%`}} />
            </div>
            <span className="text-xs text-carbon-200">{ini.avance_pct}%</span>
          </div>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-carbon-200 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-carbon-200 flex-shrink-0" />}
      </div>

      {abierto && (
        <div className="border-t border-carbon-200 p-4 bg-carbon-50 space-y-3">
          <p className="text-sm text-carbon-800">{ini.descripcion}</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-carbon-200 block">Impacto</span><strong>{ini.impacto}/5</strong></div>
            <div><span className="text-carbon-200 block">Factibilidad</span><strong>{ini.factibilidad}/5</strong></div>
            <div><span className="text-carbon-200 block">Costo est.</span><strong>{fmtCOP(ini.costo_estimado_cop)}</strong></div>
            <div><span className="text-carbon-200 block">Inicio plan</span><strong>{ini.fecha_inicio_plan}</strong></div>
            <div><span className="text-carbon-200 block">Fin plan</span><strong>{ini.fecha_fin_plan}</strong></div>
            <div><span className="text-carbon-200 block">Reducción real</span><strong>{ini.reduccion_real_tco2e ? `${fmt(ini.reduccion_real_tco2e)} tCO₂e` : '—'}</strong></div>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            {ini.estado === 'pendiente' && (
              <button onClick={() => estadoMutation.mutate({estado:'en_curso'})} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                ▶ Iniciar
              </button>
            )}
            {ini.estado === 'en_curso' && (
              <button onClick={() => {
                const real = prompt('¿Cuántas tCO₂e se redujeron realmente? (número)')
                if (real !== null) estadoMutation.mutate({estado:'completada', reduccion_real: real})
              }} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                ✓ Completar
              </button>
            )}
            {ini.estado !== 'cancelada' && ini.estado !== 'completada' && (
              <button onClick={() => estadoMutation.mutate({estado:'cancelada'})} className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                ✕ Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────
export default function ReduccionPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('planes')
  const [planSel, setPlanSel] = useState(null)
  const [showModalPlan, setShowModalPlan] = useState(false)
  const [showModalIni, setShowModalIni]   = useState(false)

  const { data: planes }    = useQuery({ queryKey:['planes'],    queryFn:() => getPlanes().then(r=>r.data.results||r.data) })
  const { data: iniciativas }=useQuery({ queryKey:['iniciativas'],queryFn:() => getIniciativas(planSel ? {plan:planSel} : {}).then(r=>r.data.results||r.data), enabled: tab==='iniciativas' || tab==='planes' })
  const { data: alertas }   = useQuery({ queryKey:['alertas-activas'], queryFn:() => getAlertasActivas().then(r=>r.data) })
  const { data: progreso }  = useQuery({ queryKey:['progreso',planSel], queryFn:() => getProgreso(planSel).then(r=>r.data), enabled:!!planSel })

  const verificarMutation = useMutation({
    mutationFn: verificarAlertas,
    onSuccess: r => { qc.invalidateQueries({queryKey:['alertas-activas']}); toast.success(`${r.data.alertas_generadas} alertas generadas`) },
  })

  const resolverMutation = useMutation({
    mutationFn: resolverAlerta,
    onSuccess: () => { qc.invalidateQueries({queryKey:['alertas-activas']}); toast.success('Alerta resuelta') },
  })

  const TABS = [
    { id:'planes',      label:'Planes',     count: planes?.length },
    { id:'iniciativas', label:'Iniciativas',count: iniciativas?.length },
    { id:'alertas',     label:'Alertas',    count: alertas?.filter(a=>!a.resuelta).length, alert: alertas?.filter(a=>!a.resuelta).length > 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-carbon-800">Plan de Reducción</h1>
          <p className="text-carbon-200 text-sm mt-1">HU-08 · HU-09 · Gestión de iniciativas y seguimiento</p>
        </div>
        <div className="flex gap-2">
          {tab === 'planes' && (
            <button onClick={() => setShowModalPlan(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo plan
            </button>
          )}
          {tab === 'iniciativas' && planSel && (
            <button onClick={() => setShowModalIni(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nueva iniciativa
            </button>
          )}
          {tab === 'alertas' && (
            <button onClick={() => verificarMutation.mutate()} disabled={verificarMutation.isPending} className="btn-secondary flex items-center gap-2">
              {verificarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Bell className="w-4 h-4"/>} Verificar alertas
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-carbon-50 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, count, alert }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id ? 'bg-white shadow-sm text-carbon-800' : 'text-carbon-200 hover:text-carbon-800'}`}
          >
            {label}
            {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${alert ? 'bg-red-500 text-white' : 'bg-primary-100 text-primary-700'}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab Planes ── */}
      {tab === 'planes' && (
        <div className="space-y-4">
          {planes?.length === 0 && (
            <div className="card text-center py-12">
              <Target className="w-10 h-10 text-carbon-200 mx-auto mb-2" />
              <p className="text-sm text-carbon-200">Crea tu primer plan de reducción</p>
            </div>
          )}
          {(planes||[]).map(plan => (
            <div key={plan.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-carbon-800">{plan.nombre}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_BADGE[plan.estado] || 'bg-carbon-100 text-carbon-200'}`}>{plan.estado}</span>
                  </div>
                  <p className="text-xs text-carbon-200 mt-1">Meta: <strong>{plan.meta_reduccion_pct}%</strong> · Base: <strong>{fmt(plan.linea_base_tco2e)} tCO₂e</strong> · Año: <strong>{plan.anio_objetivo}</strong></p>
                </div>
                <button onClick={() => { setPlanSel(plan.id); setTab('iniciativas') }}
                  className="btn-secondary text-xs">Ver iniciativas →</button>
              </div>

              {/* Progreso */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label:'Total iniciativas', val: plan.total_iniciativas },
                  { label:'Completadas', val: plan.iniciativas_completadas },
                  { label:'Período', val: `${plan.fecha_inicio} → ${plan.fecha_fin}` },
                  { label:'Responsable', val: plan.responsable_nombre || '—' },
                ].map(({label,val})=>(
                  <div key={label} className="bg-carbon-50 rounded-lg p-3">
                    <p className="text-xs text-carbon-200">{label}</p>
                    <p className="font-semibold text-carbon-800 text-sm mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Iniciativas ── */}
      {tab === 'iniciativas' && (
        <div className="space-y-4">
          {/* Filtro de plan */}
          <div className="flex items-center gap-3">
            <select className="input w-64" value={planSel||''} onChange={e=>setPlanSel(e.target.value||null)}>
              <option value="">— Todas las iniciativas —</option>
              {(planes||[]).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {planSel && progreso && (
              <div className="flex items-center gap-3 text-sm text-carbon-200">
                <span>Avance: <strong className="text-primary-600">{progreso.avance_pct}%</strong></span>
                <span>Reducción real: <strong>{fmt(progreso.reduccion_real_tco2e)} tCO₂e</strong></span>
                <span>Meta: <strong>{fmt(progreso.meta_tco2e)} tCO₂e</strong></span>
              </div>
            )}
          </div>

          {/* Lista ordenada por score */}
          {(iniciativas||[]).length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm text-carbon-200">
                {planSel ? 'Este plan no tiene iniciativas aún. Crea la primera.' : 'Selecciona un plan para ver sus iniciativas.'}
              </p>
            </div>
          ) : (
            [...(iniciativas||[])].sort((a,b) => b.score_priorizacion - a.score_priorizacion).map(ini => (
              <TarjetaIniciativa key={ini.id} ini={ini} />
            ))
          )}
        </div>
      )}

      {/* ── Tab Alertas ── */}
      {tab === 'alertas' && (
        <div className="space-y-3">
          {(alertas||[]).length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-carbon-200">Sin alertas activas. Haz clic en "Verificar alertas" para analizar el estado de las iniciativas.</p>
            </div>
          ) : (
            alertas.map(a => (
              <div key={a.id} className={`border rounded-xl p-4 flex items-start gap-3 ${a.tipo==='retraso'?'border-red-200 bg-red-50':a.tipo==='meta_riesgo'?'border-orange-200 bg-orange-50':'border-yellow-200 bg-yellow-50'}`}>
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${a.tipo==='retraso'?'text-red-500':a.tipo==='meta_riesgo'?'text-orange-500':'text-yellow-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-carbon-800">{a.iniciativa_nombre}</p>
                  <p className="text-xs text-carbon-200 mt-0.5 capitalize">{a.tipo.replace('_',' ')}</p>
                  <p className="text-sm mt-1">{a.mensaje}</p>
                </div>
                <button onClick={() => resolverMutation.mutate(a.id)}
                  className="text-xs px-3 py-1.5 bg-white border border-current rounded-lg hover:bg-opacity-80 flex-shrink-0">
                  Resolver
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {showModalPlan && <ModalPlan onClose={() => setShowModalPlan(false)} />}
      {showModalIni  && <ModalIniciativa planId={planSel} onClose={() => setShowModalIni(false)} />}
    </div>
  )
}

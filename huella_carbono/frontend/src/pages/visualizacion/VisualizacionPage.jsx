import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BarChart3, AlertTriangle, TrendingUp, Zap, Trash2,
  DollarSign, Play, Loader2, CheckCircle, XCircle,
  Eye, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { getPeriodos } from '../../services/recoleccion'
import {
  getTendencia, getEmisionPorFuente, getEnergiaPorSede,
  getResiduosPorTipo, getCostos, getAnomalias,
  getResumenAnomalias, analizarAnomalias, updateAnomalia,
} from '../../services/visualizacion'

// ── Paleta ────────────────────────────────────────────────────────
const COLORES = ['#22c55e','#f97316','#3b82f6','#a855f7','#ef4444','#eab308','#06b6d4']
const COLOR_MAP = { energia:'#22c55e', combustible:'#f97316', logistica:'#3b82f6', compras:'#a855f7', residuos:'#ef4444' }
const SEV_COLOR = { alta:'bg-red-100 text-red-700 border-red-200', media:'bg-orange-100 text-orange-700 border-orange-200', baja:'bg-yellow-100 text-yellow-700 border-yellow-200' }
const EST_COLOR = { nueva:'bg-blue-50 text-blue-700', revisada:'bg-orange-50 text-orange-700', resuelta:'bg-green-50 text-green-700', descartada:'bg-carbon-50 text-carbon-200' }

const fmt = (n, d=2) => Number(n||0).toLocaleString('es-CO', {minimumFractionDigits:d, maximumFractionDigits:d})
const fmtCOP = (n) => `$${Number(n||0).toLocaleString('es-CO',{maximumFractionDigits:0})}`

// ── Tabs ──────────────────────────────────────────────────────────
const TABS = [
  { id:'tendencia',   label:'Tendencia',  icon:TrendingUp },
  { id:'fuentes',     label:'Por Fuente', icon:BarChart3 },
  { id:'energia',     label:'Energía',    icon:Zap },
  { id:'residuos',    label:'Residuos',   icon:Trash2 },
  { id:'costos',      label:'Costos',     icon:DollarSign },
  { id:'anomalias',   label:'Anomalías',  icon:AlertTriangle },
]

// ── Tarjeta KPI ───────────────────────────────────────────────────
function KPI({ label, value, sub, color='text-primary-600' }) {
  return (
    <div className="card">
      <p className="text-xs text-carbon-200 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-carbon-200 mt-1">{sub}</p>}
    </div>
  )
}

// ── Panel Anomalía ────────────────────────────────────────────────
function TarjetaAnomalia({ anomalia, onUpdate }) {
  const [abierto, setAbierto] = useState(false)
  const [comentario, setComentario] = useState(anomalia.comentario || '')

  return (
    <div className={`border rounded-xl overflow-hidden ${SEV_COLOR[anomalia.severidad]}`}>
      <div className="flex items-start gap-3 p-4">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${SEV_COLOR[anomalia.severidad]}`}>
              {anomalia.severidad}
            </span>
            <span className="text-xs capitalize font-medium">{anomalia.fuente}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${EST_COLOR[anomalia.estado]}`}>
              {anomalia.estado}
            </span>
          </div>
          <p className="text-sm font-medium mt-1">{anomalia.descripcion}</p>
          <div className="flex gap-4 mt-2 text-xs">
            <span>Actual: <strong>{fmt(anomalia.valor_actual)} {anomalia.unidad}</strong></span>
            <span>Promedio: <strong>{fmt(anomalia.valor_promedio)} {anomalia.unidad}</strong></span>
            <span className="font-bold">+{fmt(anomalia.desviacion_pct,1)}%</span>
          </div>
        </div>
        <button onClick={() => setAbierto(!abierto)} className="flex-shrink-0 p-1">
          {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {abierto && (
        <div className="border-t border-current border-opacity-20 p-4 bg-white/50 space-y-3">
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Agrega un comentario de revisión..."
            className="w-full text-sm border border-current border-opacity-30 rounded-lg p-2 bg-white/70 resize-none"
            rows={2}
          />
          <div className="flex gap-2 flex-wrap">
            {['revisada','resuelta','descartada'].map(est => (
              <button
                key={est}
                onClick={() => onUpdate(anomalia.id, { estado: est, comentario })}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-current border-opacity-30 font-medium hover:bg-opacity-80 capitalize transition-colors"
              >
                Marcar como {est}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function VisualizacionPage() {
  const [tab, setTab]           = useState('tendencia')
  const [periodoSel, setPeriodoSel] = useState('')
  const qc = useQueryClient()

  // Queries de tableros
  const { data: tendencia  } = useQuery({ queryKey:['tablero-tendencia'],  queryFn: () => getTendencia(12).then(r=>r.data) })
  const { data: porFuente  } = useQuery({ queryKey:['tablero-fuentes'],    queryFn: () => getEmisionPorFuente().then(r=>r.data) })
  const { data: porSede    } = useQuery({ queryKey:['tablero-sede'],       queryFn: () => getEnergiaPorSede().then(r=>r.data) })
  const { data: porResiduo } = useQuery({ queryKey:['tablero-residuos'],   queryFn: () => getResiduosPorTipo().then(r=>r.data) })
  const { data: costos     } = useQuery({ queryKey:['tablero-costos'],     queryFn: () => getCostos().then(r=>r.data) })
  const { data: anomalias  } = useQuery({ queryKey:['anomalias'],          queryFn: () => getAnomalias().then(r=>r.data.results||r.data) })
  const { data: resAnomalia} = useQuery({ queryKey:['anomalias-resumen'],  queryFn: () => getResumenAnomalias().then(r=>r.data) })
  const { data: periodos   } = useQuery({ queryKey:['periodos'],           queryFn: () => import('../../services/recoleccion').then(m=>m.getPeriodos()).then(r=>r.data.results||r.data) })

  const analizarMutation = useMutation({
    mutationFn: () => analizarAnomalias(periodoSel),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey:['anomalias'] })
      qc.invalidateQueries({ queryKey:['anomalias-resumen'] })
      toast.success(`Análisis completo: ${r.data.anomalias_encontradas} anomalías detectadas`)
    },
    onError: () => toast.error('Error al analizar. Asegúrate de haber calculado la huella primero.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({id, data}) => updateAnomalia(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['anomalias'] }); toast.success('Anomalía actualizada') },
  })

  // KPIs de resumen de anomalías
  const totalAnomaliasActivas = resAnomalia?.por_estado?.nueva || 0
  const totalAltas = resAnomalia?.por_severidad?.alta || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-carbon-800">Tableros de Visualización</h1>
        <p className="text-carbon-200 text-sm mt-1">HU-06 · HU-07 · Análisis de emisiones y detección de anomalías</p>
      </div>

      {/* KPIs rápidos de anomalías */}
      {resAnomalia && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPI label="Anomalías activas"  value={totalAnomaliasActivas} color={totalAnomaliasActivas > 0 ? 'text-red-600':'text-primary-600'} />
          <KPI label="Severidad alta"     value={totalAltas}            color={totalAltas > 0 ? 'text-red-600':'text-carbon-800'} />
          <KPI label="Resueltas"          value={resAnomalia.por_estado?.resuelta || 0}  color="text-green-600" />
          <KPI label="Descartadas"        value={resAnomalia.por_estado?.descartada || 0} color="text-carbon-200" />
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="flex gap-1 flex-wrap bg-carbon-50 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow-sm text-carbon-800' : 'text-carbon-200 hover:text-carbon-800'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Tab: Tendencia ── */}
      {tab === 'tendencia' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-4">Huella de carbono total — Evolución mensual</h3>
            {tendencia?.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={tendencia} margin={{top:5,right:20,left:0,bottom:5}}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} unit=" t" />
                  <Tooltip formatter={(v) => [`${fmt(v,3)} tCO₂e`]} />
                  <Area type="monotone" dataKey="total" name="Total tCO₂e"
                    stroke="#22c55e" fill="url(#gradTotal)" strokeWidth={2.5} dot={{r:4}} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-4">Desglose por fuente — Evolución</h3>
            {tendencia?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tendencia} margin={{top:5,right:20,left:0,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} unit=" t" />
                  <Tooltip formatter={(v,n) => [`${fmt(v,3)} tCO₂e`, n]} />
                  <Legend />
                  {['energia','combustible','logistica','compras','residuos'].map(k => (
                    <Bar key={k} dataKey={k} name={k.charAt(0).toUpperCase()+k.slice(1)}
                      stackId="a" fill={COLOR_MAP[k]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>
      )}

      {/* ── Tab: Por fuente ── */}
      {tab === 'fuentes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-4">Distribución acumulada por fuente</h3>
            {porFuente?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={porFuente} dataKey="tco2e" nameKey="fuente"
                    cx="50%" cy="50%" outerRadius={110}
                    label={({fuente, porcentaje}) => `${fuente} ${porcentaje}%`}
                  >
                    {(porFuente||[]).map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fmt(v,3)} tCO₂e`,'Emisión']} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-4">tCO₂e por fuente (acumulado)</h3>
            {porFuente?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={porFuente} layout="vertical" margin={{top:5,right:30,left:20,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fontSize:11}} unit=" t" />
                  <YAxis dataKey="fuente" type="category" tick={{fontSize:11}} width={90}/>
                  <Tooltip formatter={(v) => [`${fmt(v,3)} tCO₂e`,'Emisión']} />
                  <Bar dataKey="tco2e" name="tCO₂e" radius={[0,4,4,0]}>
                    {(porFuente||[]).map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>
      )}

      {/* ── Tab: Energía ── */}
      {tab === 'energia' && (
        <div className="card">
          <h3 className="font-semibold text-carbon-800 mb-4">Consumo de energía por sede y tipo</h3>
          {porSede?.length ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={porSede} margin={{top:5,right:20,left:0,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sede" tick={{fontSize:10}} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{fontSize:11}} unit=" kWh" />
                <Tooltip formatter={(v,n) => [`${fmt(v,0)} kWh`, n]} />
                <Legend />
                <Bar dataKey="total_kwh" name="kWh consumidos" fill="#22c55e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}

          {porSede?.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-carbon-200">
                  <tr>
                    {['Sede','Tipo','kWh consumidos','Registros'].map(h=>(
                      <th key={h} className="text-left px-3 py-2 text-xs text-carbon-200 font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-200">
                  {porSede.map((r,i)=>(
                    <tr key={i} className="hover:bg-carbon-50">
                      <td className="px-3 py-2 font-medium">{r.sede}</td>
                      <td className="px-3 py-2 capitalize">{r.tipo_energia}</td>
                      <td className="px-3 py-2">{fmt(r.total_kwh,0)}</td>
                      <td className="px-3 py-2">{r.registros}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Residuos ── */}
      {tab === 'residuos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-4">Residuos por tipo (kg)</h3>
            {porResiduo?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={porResiduo} dataKey="total_kg" nameKey="tipo_residuo"
                    cx="50%" cy="50%" outerRadius={100}
                    label={({tipo_residuo}) => tipo_residuo}
                  >
                    {(porResiduo||[]).map((_,i)=>(
                      <Cell key={i} fill={COLORES[i%COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fmt(v,1)} kg`,'Residuos']} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>

          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-4">Por método de disposición</h3>
            {porResiduo?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={porResiduo} layout="vertical" margin={{top:5,right:20,left:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fontSize:11}} unit=" kg" />
                  <YAxis dataKey="metodo_disposicion" type="category" tick={{fontSize:10}} width={110}/>
                  <Tooltip formatter={(v) => [`${fmt(v,1)} kg`,'Residuos']} />
                  <Bar dataKey="total_kg" name="kg" radius={[0,4,4,0]}>
                    {(porResiduo||[]).map((_,i)=><Cell key={i} fill={COLORES[i%COLORES.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>
      )}

      {/* ── Tab: Costos ── */}
      {tab === 'costos' && (
        <div className="card">
          <h3 className="font-semibold text-carbon-800 mb-4">Costos operativos por período (COP)</h3>
          {costos?.length ? (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={costos} margin={{top:5,right:20,left:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="periodo" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v) => [fmtCOP(v)]} />
                  <Legend />
                  {['energia_cop','combustible_cop','compras_cop','residuos_cop'].map((k,i)=>(
                    <Bar key={k} dataKey={k} name={k.replace('_cop','').charAt(0).toUpperCase()+k.replace('_cop','').slice(1)}
                      stackId="a" fill={COLORES[i]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-carbon-200">
                    <tr>
                      {['Período','Energía','Combustible','Compras','Residuos','Total'].map(h=>(
                        <th key={h} className="text-left px-3 py-2 text-xs text-carbon-200 font-semibold uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-200">
                    {costos.map((r,i)=>(
                      <tr key={i} className="hover:bg-carbon-50">
                        <td className="px-3 py-2 font-medium">{r.periodo}</td>
                        <td className="px-3 py-2">{fmtCOP(r.energia_cop)}</td>
                        <td className="px-3 py-2">{fmtCOP(r.combustible_cop)}</td>
                        <td className="px-3 py-2">{fmtCOP(r.compras_cop)}</td>
                        <td className="px-3 py-2">{fmtCOP(r.residuos_cop)}</td>
                        <td className="px-3 py-2 font-bold text-primary-600">{fmtCOP(r.total_cop)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <EmptyChart label="Sin datos de costos aún" />}
        </div>
      )}

      {/* ── Tab: Anomalías ── */}
      {tab === 'anomalias' && (
        <div className="space-y-5">
          {/* Panel de análisis */}
          <div className="card">
            <h3 className="font-semibold text-carbon-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Detectar anomalías
            </h3>
            <p className="text-sm text-carbon-200 mb-4">
              Compara el consumo del período seleccionado contra el promedio histórico.
              Una desviación mayor al 30% genera una alerta.
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="label">Período a analizar</label>
                <select value={periodoSel} onChange={e=>setPeriodoSel(e.target.value)} className="input">
                  <option value="">— Selecciona período —</option>
                  {(periodos||[]).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => analizarMutation.mutate()}
                disabled={!periodoSel || analizarMutation.isPending}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {analizarMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin"/>Analizando...</>
                  : <><Play className="w-4 h-4"/>Analizar</>
                }
              </button>
            </div>
          </div>

          {/* Lista de anomalías */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-carbon-800">
                Anomalías detectadas ({anomalias?.length || 0})
              </h3>
              {resAnomalia && (
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">{resAnomalia.por_severidad?.alta||0} altas</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">{resAnomalia.por_severidad?.media||0} medias</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">{resAnomalia.por_severidad?.baja||0} bajas</span>
                </div>
              )}
            </div>

            {anomalias?.length > 0 ? (
              anomalias.map(a => (
                <TarjetaAnomalia
                  key={a.id}
                  anomalia={a}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                />
              ))
            ) : (
              <div className="card text-center py-10 text-carbon-200">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="text-sm">Sin anomalías detectadas. Selecciona un período y ejecuta el análisis.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ label='Sin datos suficientes. Carga datos y ejecuta el cálculo de huella primero.' }) {
  return (
    <div className="h-48 flex items-center justify-center bg-carbon-50 rounded-xl">
      <div className="text-center">
        <BarChart3 className="w-10 h-10 text-carbon-200 mx-auto mb-2" />
        <p className="text-sm text-carbon-200 max-w-xs">{label}</p>
      </div>
    </div>
  )
}

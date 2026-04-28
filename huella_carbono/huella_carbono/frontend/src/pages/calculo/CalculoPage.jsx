import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Calculator, Play, Loader2, Leaf, Zap, Fuel,
  Truck, Package, Trash2, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts'
import { getPeriodos } from '../../services/recoleccion'
import { calcularPeriodo, getCalculos, getFactores } from '../../services/calculo'

// ── Paleta de colores por fuente ──────────────────────────────────
const COLORES = {
  'Energía':     '#22c55e',
  'Combustible': '#f97316',
  'Logística':   '#3b82f6',
  'Compras':     '#a855f7',
  'Residuos':    '#ef4444',
}

const ICONOS = {
  'Energía':     Zap,
  'Combustible': Fuel,
  'Logística':   Truck,
  'Compras':     Package,
  'Residuos':    Trash2,
}

// ── Formato de números ─────────────────────────────────────────────
const fmt = (n, dec = 4) => Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec })
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`

// ── Tarjeta de resumen por fuente ─────────────────────────────────
function TarjetaFuente({ fuente, tco2e, porcentaje }) {
  const Icon = ICONOS[fuente] || Leaf
  const color = COLORES[fuente] || '#22c55e'
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-carbon-200 font-medium">{fuente}</p>
        <p className="text-lg font-bold text-carbon-800">{fmt(tco2e, 3)} <span className="text-xs font-normal text-carbon-200">tCO₂e</span></p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-carbon-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: color }} />
          </div>
          <span className="text-xs text-carbon-200">{fmtPct(porcentaje)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Tabla de detalle expandible ────────────────────────────────────
function TablaDetalle({ titulo, datos, columnas }) {
  const [abierto, setAbierto] = useState(false)
  if (!datos?.length) return null
  return (
    <div className="border border-carbon-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-5 py-3 bg-carbon-50 hover:bg-carbon-100 transition-colors"
      >
        <span className="font-medium text-sm text-carbon-800">{titulo} ({datos.length} registros)</span>
        {abierto ? <ChevronUp className="w-4 h-4 text-carbon-200" /> : <ChevronDown className="w-4 h-4 text-carbon-200" />}
      </button>
      {abierto && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-carbon-200 bg-white">
              <tr>
                {columnas.map(c => (
                  <th key={c.key} className="text-left px-4 py-2 text-carbon-200 font-semibold uppercase tracking-wide">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-200">
              {datos.map((row, i) => (
                <tr key={i} className="hover:bg-carbon-50">
                  {columnas.map(c => (
                    <td key={c.key} className="px-4 py-2 text-carbon-800">
                      {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function CalculoPage() {
  const qc = useQueryClient()
  const [periodoSel, setPeriodoSel] = useState('')
  const [resultado, setResultado]   = useState(null)
  const [tabDetalle, setTabDetalle] = useState('energia')

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => getPeriodos().then(r => r.data.results || r.data),
  })

  const { data: historial } = useQuery({
    queryKey: ['calculos'],
    queryFn: () => getCalculos().then(r => r.data.results || r.data),
  })

  const { data: factoresData } = useQuery({
    queryKey: ['factores'],
    queryFn: () => getFactores().then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: () => calcularPeriodo(periodoSel),
    onSuccess: (res) => {
      setResultado(res.data.calculo_completo)
      qc.invalidateQueries({ queryKey: ['calculos'] })
      toast.success(`Cálculo completado: ${res.data.calculo_completo.total_tco2e} tCO₂e`)
    },
    onError: () => toast.error('Error al calcular. Verifica que el período tenga datos.'),
  })

  const pieDatos = resultado?.resumen?.filter(r => r.tco2e > 0) || []

  const COLS_DETALLE = {
    energia: [
      { key: 'sede',              label: 'Sede' },
      { key: 'tipo',              label: 'Tipo' },
      { key: 'consumo_kwh',       label: 'kWh',    render: v => fmt(v, 2) },
      { key: 'factor_kgco2e_kwh', label: 'Factor', render: v => v },
      { key: 'emision_tco2e',     label: 'tCO₂e',  render: v => fmt(v, 6) },
    ],
    combustible: [
      { key: 'tipo',                label: 'Tipo' },
      { key: 'placa_o_equipo',      label: 'Placa/Equipo' },
      { key: 'litros',              label: 'Litros',  render: v => fmt(v, 2) },
      { key: 'factor_kgco2e_litro', label: 'Factor',  render: v => v },
      { key: 'emision_tco2e',       label: 'tCO₂e',   render: v => fmt(v, 6) },
    ],
    logistica: [
      { key: 'origen',          label: 'Origen' },
      { key: 'destino',         label: 'Destino' },
      { key: 'toneladas_km',    label: 'tkm',    render: v => fmt(v, 2) },
      { key: 'factor_kgco2e_tkm', label: 'Factor' },
      { key: 'emision_tco2e',   label: 'tCO₂e',  render: v => fmt(v, 6) },
    ],
    compras: [
      { key: 'descripcion',     label: 'Artículo' },
      { key: 'categoria',       label: 'Categoría' },
      { key: 'peso_kg',         label: 'kg',     render: v => fmt(v, 3) },
      { key: 'factor_kgco2e_kg',label: 'Factor' },
      { key: 'emision_tco2e',   label: 'tCO₂e',  render: v => fmt(v, 6) },
    ],
    residuos: [
      { key: 'tipo_residuo',        label: 'Tipo' },
      { key: 'metodo_disposicion',  label: 'Disposición' },
      { key: 'cantidad_kg',         label: 'kg',     render: v => fmt(v, 3) },
      { key: 'factor_kgco2e_kg',    label: 'Factor' },
      { key: 'emision_tco2e',       label: 'tCO₂e',  render: v => fmt(v, 6) },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-carbon-800">Cálculo de Huella de Carbono</h1>
        <p className="text-carbon-200 text-sm mt-1">HU-05 · Factores UPME 2023, IPCC AR6 y GHG Protocol</p>
      </div>

      {/* Panel de cálculo */}
      <div className="card">
        <h2 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary-600" /> Calcular período
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Selecciona el período</label>
            <select
              value={periodoSel}
              onChange={e => setPeriodoSel(e.target.value)}
              className="input"
            >
              <option value="">— Elige un período —</option>
              {(periodos || []).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={!periodoSel || mutation.isPending}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculando...</>
              : <><Play className="w-4 h-4" /> Calcular</>
            }
          </button>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <>
          {/* Total */}
          <div className="card bg-primary-600 text-white flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Huella total — {resultado.periodo}</p>
              <p className="text-4xl font-bold mt-1">{fmt(resultado.total_tco2e, 3)}</p>
              <p className="text-primary-200 text-sm">toneladas de CO₂ equivalente</p>
            </div>
            <Leaf className="w-16 h-16 text-primary-400 opacity-50" />
          </div>

          {/* Tarjetas por fuente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {resultado.resumen.map(r => (
              <TarjetaFuente key={r.fuente} {...r} />
            ))}
          </div>

          {/* Gráfico de torta */}
          {pieDatos.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-carbon-800 mb-4">Distribución por fuente</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieDatos}
                    dataKey="tco2e"
                    nameKey="fuente"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ fuente, porcentaje }) => `${fuente} ${fmtPct(porcentaje)}`}
                  >
                    {pieDatos.map(entry => (
                      <Cell key={entry.fuente} fill={COLORES[entry.fuente] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fmt(v, 3)} tCO₂e`, 'Emisión']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detalle por fuente */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-carbon-800 mb-2">Detalle por registro</h3>

            {/* Tabs de fuente */}
            <div className="flex gap-1 flex-wrap mb-2">
              {Object.keys(COLS_DETALLE).map(k => (
                <button
                  key={k}
                  onClick={() => setTabDetalle(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    tabDetalle === k ? 'bg-primary-600 text-white' : 'bg-carbon-50 text-carbon-200 hover:text-carbon-800'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-carbon-200">
              <table className="w-full text-xs">
                <thead className="bg-carbon-50 border-b border-carbon-200">
                  <tr>
                    {COLS_DETALLE[tabDetalle].map(c => (
                      <th key={c.key} className="text-left px-4 py-2 text-carbon-200 font-semibold uppercase tracking-wide">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-200">
                  {(resultado.detalle[tabDetalle] || []).map((row, i) => (
                    <tr key={i} className="hover:bg-carbon-50">
                      {COLS_DETALLE[tabDetalle].map(c => (
                        <td key={c.key} className="px-4 py-2 text-carbon-800">
                          {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!(resultado.detalle[tabDetalle]?.length) && (
                    <tr><td colSpan={COLS_DETALLE[tabDetalle].length} className="px-4 py-6 text-center text-carbon-200">Sin registros para esta fuente</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Historial de cálculos */}
      {historial?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-carbon-800 mb-4">Historial de cálculos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-carbon-200">
                <tr>
                  {['Período','Total tCO₂e','Energía','Combustible','Logística','Compras','Residuos','Calculado'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-carbon-200 font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-200">
                {historial.map(r => (
                  <tr key={r.id} className="hover:bg-carbon-50">
                    <td className="px-3 py-2 font-medium">{r.periodo_label}</td>
                    <td className="px-3 py-2 font-bold text-primary-600">{fmt(r.total_tco2e, 3)}</td>
                    <td className="px-3 py-2">{fmt(r.energia_tco2e, 3)}</td>
                    <td className="px-3 py-2">{fmt(r.combustible_tco2e, 3)}</td>
                    <td className="px-3 py-2">{fmt(r.logistica_tco2e, 3)}</td>
                    <td className="px-3 py-2">{fmt(r.compras_tco2e, 3)}</td>
                    <td className="px-3 py-2">{fmt(r.residuos_tco2e, 3)}</td>
                    <td className="px-3 py-2 text-xs text-carbon-200">{r.calculado_por_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factores de emisión */}
      {factoresData && (
        <div className="card">
          <h3 className="font-semibold text-carbon-800 mb-1 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> Factores de emisión aplicados
          </h3>
          <p className="text-xs text-carbon-200 mb-4">{factoresData.nota}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { titulo: 'Energía (kgCO₂e/kWh)',      data: factoresData.energia_kwh },
              { titulo: 'Combustible (kgCO₂e/litro)', data: factoresData.combustible_litro },
              { titulo: 'Logística (kgCO₂e/tkm)',     data: factoresData.logistica_tkm },
              { titulo: 'Consumibles (kgCO₂e/kg)',    data: factoresData.consumible_kg },
              { titulo: 'Residuos (kgCO₂e/kg)',       data: factoresData.residuo_kg },
            ].map(({ titulo, data }) => (
              <div key={titulo} className="bg-carbon-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-carbon-800 mb-2">{titulo}</p>
                <ul className="space-y-1">
                  {Object.entries(data || {}).map(([k, v]) => (
                    <li key={k} className="flex justify-between text-xs">
                      <span className="text-carbon-200 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-carbon-800">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

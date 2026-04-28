import { useQuery } from '@tanstack/react-query'
import { Leaf, Database, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useAuthStore from '../context/authStore'
import { getResumenGeneral } from '../services/visualizacion'

const fmt = (n, d=3) => Number(n||0).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d})

export default function DashboardPage() {
  const { usuario } = useAuthStore()

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['resumen-general'],
    queryFn:  () => getResumenGeneral().then(r => r.data),
  })

  const tendencia = resumen?.tendencia_ultimos_3 || []
  const ultimoTotal  = tendencia[tendencia.length - 1]?.total || 0
  const anteriorTotal= tendencia[tendencia.length - 2]?.total || 0
  const variacion    = anteriorTotal > 0 ? ((ultimoTotal - anteriorTotal) / anteriorTotal * 100) : null

  const VariIcon = variacion === null ? Minus : variacion < 0 ? TrendingDown : TrendingUp
  const varColor = variacion === null ? 'text-carbon-200' : variacion < 0 ? 'text-green-600' : 'text-red-500'

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-carbon-800">
          Hola, {usuario?.first_name || 'usuario'} 👋
        </h1>
        <p className="text-carbon-200 mt-1 text-sm">Resumen del sistema de gestión de huella de carbono</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50">
            <Leaf className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-carbon-200 font-medium">Última huella calculada</p>
            {isLoading ? <div className="h-6 w-24 bg-carbon-100 animate-pulse rounded mt-1" /> : (
              <>
                <p className="text-xl font-bold text-carbon-800">
                  {resumen?.ultimo_calculo?.periodo
                    ? <>{fmt(resumen.ultimo_calculo.total_tco2e)} <span className="text-xs font-normal text-carbon-200">tCO₂e</span></>
                    : '—'}
                </p>
                <p className="text-xs text-carbon-200">{resumen?.ultimo_calculo?.periodo || 'Sin cálculos aún'}</p>
              </>
            )}
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-carbon-200 font-medium">Períodos registrados</p>
            {isLoading ? <div className="h-6 w-12 bg-carbon-100 animate-pulse rounded mt-1" /> : (
              <p className="text-xl font-bold text-carbon-800">{resumen?.periodos_registrados ?? '—'}</p>
            )}
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className={`p-3 rounded-xl ${(resumen?.anomalias_activas || 0) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <AlertTriangle className={`w-5 h-5 ${(resumen?.anomalias_activas || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <div>
            <p className="text-xs text-carbon-200 font-medium">Anomalías activas</p>
            {isLoading ? <div className="h-6 w-12 bg-carbon-100 animate-pulse rounded mt-1" /> : (
              <p className={`text-xl font-bold ${(resumen?.anomalias_activas || 0) > 0 ? 'text-red-600' : 'text-carbon-800'}`}>
                {resumen?.anomalias_activas ?? '—'}
              </p>
            )}
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className={`p-3 rounded-xl ${variacion === null ? 'bg-carbon-50' : variacion < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <VariIcon className={`w-5 h-5 ${varColor}`} />
          </div>
          <div>
            <p className="text-xs text-carbon-200 font-medium">Variación vs período anterior</p>
            {isLoading ? <div className="h-6 w-16 bg-carbon-100 animate-pulse rounded mt-1" /> : (
              <p className={`text-xl font-bold ${varColor}`}>
                {variacion !== null ? `${variacion > 0 ? '+' : ''}${variacion.toFixed(1)}%` : '—'}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Mini gráfico de tendencia */}
      <div className="card">
        <h3 className="font-semibold text-carbon-800 mb-4">Tendencia reciente — tCO₂e</h3>
        {tendencia.length >= 2 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tendencia} margin={{top:5,right:20,left:0,bottom:5}}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} unit=" t" />
              <Tooltip formatter={(v) => [`${fmt(v)} tCO₂e`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="#22c55e" fill="url(#grad)" strokeWidth={2.5} dot={{r:4}} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center bg-carbon-50 rounded-xl">
            <p className="text-sm text-carbon-200">Ejecuta al menos 2 cálculos de huella para ver la tendencia</p>
          </div>
        )}
      </div>

      {/* Guía de inicio rápido */}
      {!resumen?.ultimo_calculo?.periodo && !isLoading && (
        <div className="card border-primary-200 bg-primary-50">
          <h3 className="font-semibold text-primary-800 mb-3">🚀 Primeros pasos</h3>
          <ol className="space-y-2 text-sm text-primary-700 list-decimal list-inside">
            <li>Ve a <strong>Recolección de Datos</strong> → crea un período y carga tus facturas de energía, combustible, compras y residuos</li>
            <li>Ve a <strong>Cálculo de Huella</strong> → selecciona el período y haz clic en Calcular</li>
            <li>Ve a <strong>Visualización</strong> → explora los tableros y detecta anomalías</li>
            <li>Ve a <strong>Plan de Reducción</strong> → crea iniciativas basadas en las anomalías encontradas</li>
          </ol>
        </div>
      )}
    </div>
  )
}

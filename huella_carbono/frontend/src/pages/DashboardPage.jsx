import { Leaf, Database, Calculator, BarChart3, Target } from 'lucide-react'
import useAuthStore from '../context/authStore'

const stats = [
  { label: 'Datos cargados',    value: '—', icon: Database,   color: 'bg-blue-50 text-blue-600' },
  { label: 'Huella total',      value: '—', icon: Leaf,       color: 'bg-green-50 text-green-600', unit: 'tCO₂e' },
  { label: 'Iniciativas activas', value: '—', icon: Target,   color: 'bg-orange-50 text-orange-600' },
  { label: 'Reducción lograda', value: '—', icon: BarChart3,  color: 'bg-purple-50 text-purple-600', unit: '%' },
]

export default function DashboardPage() {
  const { usuario } = useAuthStore()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-carbon-800">
          Hola, {usuario?.first_name || 'usuario'} 👋
        </h1>
        <p className="text-carbon-200 mt-1">
          Resumen del sistema de gestión de huella de carbono
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, unit }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-carbon-200 font-medium">{label}</p>
              <p className="text-xl font-bold text-carbon-800">
                {value} <span className="text-sm font-normal text-carbon-200">{unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-carbon-800 mb-4">Emisiones por fuente</h3>
          <div className="h-48 flex items-center justify-center bg-carbon-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-carbon-200 mx-auto mb-2" />
              <p className="text-sm text-carbon-200">Disponible en Parte 4</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-carbon-800 mb-4">Tendencia mensual</h3>
          <div className="h-48 flex items-center justify-center bg-carbon-50 rounded-lg">
            <div className="text-center">
              <Calculator className="w-10 h-10 text-carbon-200 mx-auto mb-2" />
              <p className="text-sm text-carbon-200">Disponible en Parte 3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

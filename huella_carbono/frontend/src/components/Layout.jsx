import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Database, Calculator, BarChart3,
  Target, FileText, LogOut, Leaf, User
} from 'lucide-react'
import useAuthStore from '../context/authStore'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recoleccion',    icon: Database,         label: 'Recolección de Datos' },
  { to: '/calculo',        icon: Calculator,       label: 'Cálculo de Huella' },
  { to: '/visualizacion',  icon: BarChart3,        label: 'Visualización' },
  { to: '/reduccion',      icon: Target,           label: 'Plan de Reducción' },
  { to: '/reportes',       icon: FileText,         label: 'Reportes' },
]

export default function Layout() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-carbon-50">
      {/* Sidebar */}
      <aside className="w-64 bg-carbon-900 text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="bg-primary-500 p-2 rounded-lg">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Huella de</p>
            <p className="font-bold text-primary-400 leading-tight">Carbono</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-carbon-200 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {usuario?.nombre_completo || usuario?.email}
              </p>
              <p className="text-xs text-carbon-200 capitalize">{usuario?.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-carbon-200
                       hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

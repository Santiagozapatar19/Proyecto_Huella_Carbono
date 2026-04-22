import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './context/authStore'

// Pages (se implementan en partes siguientes)
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'

// Ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Las siguientes rutas se agregan en partes 2-5 */}
        {/* <Route path="recoleccion/*" element={<RecoleccionPage />} /> */}
        {/* <Route path="calculo" element={<CalculoPage />} /> */}
        {/* <Route path="visualizacion" element={<VisualizacionPage />} /> */}
        {/* <Route path="reduccion/*" element={<ReduccionPage />} /> */}
        {/* <Route path="reportes" element={<ReportesPage />} /> */}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './context/authStore'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import RecoleccionPage from './pages/recoleccion/RecoleccionPage'
import CalculoPage     from './pages/calculo/CalculoPage'
import VisualizacionPage from './pages/visualizacion/VisualizacionPage'
import ReduccionPage   from './pages/reduccion/ReduccionPage'
import ReportesPage    from './pages/reportes/ReportesPage'
import Layout          from './components/Layout'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="recoleccion"   element={<RecoleccionPage />} />
        <Route path="calculo"       element={<CalculoPage />} />
        <Route path="visualizacion" element={<VisualizacionPage />} />
        <Route path="reduccion"     element={<ReduccionPage />} />
        <Route path="reportes"      element={<ReportesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

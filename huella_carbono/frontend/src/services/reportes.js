import api from './api'

export const getReportes = () => api.get('/reportes/')

// Descarga directa abriendo la URL con el token en header no funciona en <a>,
// así que usamos fetch/axios con blob
const descargar = async (url, filename) => {
  const token = localStorage.getItem('access_token')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Error al generar el reporte')
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href  = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const descargarHuellaCSV      = () => descargar('/api/reportes/huella/csv/',      `huella_${new Date().toISOString().slice(0,10)}.csv`)
export const descargarIniciativasCSV = () => descargar('/api/reportes/iniciativas/csv/', `iniciativas_${new Date().toISOString().slice(0,10)}.csv`)
export const descargarAnomaliasCSV   = () => descargar('/api/reportes/anomalias/csv/',   `anomalias_${new Date().toISOString().slice(0,10)}.csv`)
export const descargarEjecutivoPDF   = () => descargar('/api/reportes/ejecutivo/pdf/',   `reporte_ejecutivo_${new Date().toISOString().slice(0,10)}.pdf`)

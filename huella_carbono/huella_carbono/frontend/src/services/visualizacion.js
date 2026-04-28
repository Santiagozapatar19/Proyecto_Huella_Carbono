import api from './api'

// Tableros HU-06
export const getTendencia       = (periodos = 12) => api.get(`/visualizacion/tablero/tendencia/?periodos=${periodos}`)
export const getEmisionPorFuente= ()              => api.get('/visualizacion/tablero/emision_por_fuente/')
export const getEnergiaPorSede  = ()              => api.get('/visualizacion/tablero/energia_por_sede/')
export const getResiduosPorTipo = ()              => api.get('/visualizacion/tablero/residuos_por_tipo/')
export const getCostos          = ()              => api.get('/visualizacion/tablero/costos/')
export const getResumenGeneral  = ()              => api.get('/visualizacion/tablero/resumen_general/')

// Anomalías HU-07
export const getAnomalias       = (params)        => api.get('/visualizacion/anomalias/', { params })
export const getResumenAnomalias= ()              => api.get('/visualizacion/anomalias/resumen/')
export const analizarAnomalias  = (periodoId)     => api.post(`/visualizacion/anomalias/analizar/${periodoId}/`)
export const updateAnomalia     = (id, data)      => api.patch(`/visualizacion/anomalias/${id}/`, data)

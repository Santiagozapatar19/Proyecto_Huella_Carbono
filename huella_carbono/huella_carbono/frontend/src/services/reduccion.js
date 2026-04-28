import api from './api'

// Planes
export const getPlanes      = (p)   => api.get('/reduccion/planes/', { params: p })
export const getPlan        = (id)  => api.get(`/reduccion/planes/${id}/`)
export const createPlan     = (d)   => api.post('/reduccion/planes/', d)
export const updatePlan     = (id,d)=> api.patch(`/reduccion/planes/${id}/`, d)
export const deletePlan     = (id)  => api.delete(`/reduccion/planes/${id}/`)
export const getProgreso    = (id)  => api.get(`/reduccion/planes/${id}/progreso/`)
export const getCronograma  = (id)  => api.get(`/reduccion/planes/${id}/cronograma/`)

// Iniciativas
export const getIniciativas    = (p)   => api.get('/reduccion/iniciativas/', { params: p })
export const createIniciativa  = (d)   => api.post('/reduccion/iniciativas/', d)
export const updateIniciativa  = (id,d)=> api.patch(`/reduccion/iniciativas/${id}/`, d)
export const deleteIniciativa  = (id)  => api.delete(`/reduccion/iniciativas/${id}/`)
export const cambiarEstado     = (id,d)=> api.post(`/reduccion/iniciativas/${id}/cambiar_estado/`, d)
export const getIniciativasPriorizadas = () => api.get('/reduccion/iniciativas/priorizadas/')
export const verificarAlertas  = ()    => api.post('/reduccion/iniciativas/verificar_alertas/')

// Evidencias
export const getEvidencias  = (iniciativaId) => api.get('/reduccion/evidencias/', { params: { iniciativa: iniciativaId } })
export const createEvidencia= (d)            => api.post('/reduccion/evidencias/', d)

// Alertas
export const getAlertasActivas = () => api.get('/reduccion/alertas/activas/')
export const resolverAlerta    = (id) => api.post(`/reduccion/alertas/${id}/resolver/`)

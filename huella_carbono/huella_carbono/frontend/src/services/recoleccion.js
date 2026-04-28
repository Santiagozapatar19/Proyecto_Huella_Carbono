import api from './api'

// ── Períodos ──────────────────────────────────────────────────────
export const getPeriodos    = ()       => api.get('/recoleccion/periodos/')
export const createPeriodo  = (data)   => api.post('/recoleccion/periodos/', data)
export const cerrarPeriodo  = (id)     => api.post(`/recoleccion/periodos/${id}/cerrar/`)
export const getResumenPeriodo = (id)  => api.get(`/recoleccion/periodos/${id}/resumen/`)

// ── HU-01: Energía ────────────────────────────────────────────────
export const getEnergia     = (params) => api.get('/recoleccion/energia/', { params })
export const createEnergia  = (data)   => api.post('/recoleccion/energia/', data)
export const updateEnergia  = (id, d)  => api.patch(`/recoleccion/energia/${id}/`, d)
export const deleteEnergia  = (id)     => api.delete(`/recoleccion/energia/${id}/`)

// ── HU-02: Combustible ────────────────────────────────────────────
export const getCombustible    = (p) => api.get('/recoleccion/combustible/', { params: p })
export const createCombustible = (d) => api.post('/recoleccion/combustible/', d)
export const updateCombustible = (id, d) => api.patch(`/recoleccion/combustible/${id}/`, d)
export const deleteCombustible = (id)    => api.delete(`/recoleccion/combustible/${id}/`)

// ── HU-02: Logística ─────────────────────────────────────────────
export const getLogistica    = (p) => api.get('/recoleccion/logistica/', { params: p })
export const createLogistica = (d) => api.post('/recoleccion/logistica/', d)
export const updateLogistica = (id, d) => api.patch(`/recoleccion/logistica/${id}/`, d)
export const deleteLogistica = (id)    => api.delete(`/recoleccion/logistica/${id}/`)

// ── HU-03: Compras ────────────────────────────────────────────────
export const getCompras    = (p) => api.get('/recoleccion/compras/', { params: p })
export const createCompras = (d) => api.post('/recoleccion/compras/', d)
export const updateCompras = (id, d) => api.patch(`/recoleccion/compras/${id}/`, d)
export const deleteCompras = (id)    => api.delete(`/recoleccion/compras/${id}/`)

// ── HU-04: Residuos ───────────────────────────────────────────────
export const getResiduos    = (p) => api.get('/recoleccion/residuos/', { params: p })
export const createResiduos = (d) => api.post('/recoleccion/residuos/', d)
export const updateResiduos = (id, d) => api.patch(`/recoleccion/residuos/${id}/`, d)
export const deleteResiduos = (id)    => api.delete(`/recoleccion/residuos/${id}/`)

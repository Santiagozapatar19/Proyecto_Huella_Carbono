import api from './api'

export const calcularPeriodo  = (periodoId) => api.post(`/calculo/calcular/${periodoId}/`)
export const getCalculos      = ()           => api.get('/calculo/')
export const getTendencia     = ()           => api.get('/calculo/tendencia/')
export const getResumenActual = ()           => api.get('/calculo/resumen_actual/')
export const getFactores      = ()           => api.get('/calculo/factores/')

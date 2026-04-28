import { create } from 'zustand'
import api from '../services/api'

const useAuthStore = create((set) => ({
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login/', { email, password })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      set({ usuario: data.usuario, isAuthenticated: true, isLoading: false })
      return true
    } catch (err) {
      const msg = err.response?.data?.detail || 'Credenciales inválidas'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.clear()
    set({ usuario: null, isAuthenticated: false })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore

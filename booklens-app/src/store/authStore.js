import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'

const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      login: async (usernameOrEmail, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.login({ usernameOrEmail, password })
          _saveTokens(data)
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          const message = err.response?.data?.message || 'Invalid credentials'
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      register: async (username, email, password, displayName) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.register({ username, email, password, displayName })
          _saveTokens(data)
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      googleLogin: async (credential) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.googleSignIn(credential)
          _saveTokens(data)
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          const message = err.response?.data?.message || 'Google sign-in failed'
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null }),
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'booklens-auth',
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

function _saveTokens(data) {
  localStorage.setItem('accessToken',  data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}

export default useAuthStore

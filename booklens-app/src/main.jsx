import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/tokens.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppShell />
      </GoogleOAuthProvider>
    ) : (
      <AppShell />
    )}
  </StrictMode>
)

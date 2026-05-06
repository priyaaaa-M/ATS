import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { authApi } from './api'
import { router } from './router'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

useAuthStore.getState().setLoading(true)
authApi
  .getMe()
  .then((response) => {
    if (response.authenticated && response.user) {
      useAuthStore.getState().setUser(response.user)
      useAuthStore.getState().setCompany(response.user.company ?? null)
    } else {
      useAuthStore.getState().logout()
    }
  })
  .catch(() => {
    useAuthStore.getState().logout()
  })
  .finally(() => {
    useAuthStore.getState().setLoading(false)
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)

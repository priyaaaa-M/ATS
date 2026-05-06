import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/auth/LoginPage'
import { InviteAcceptPage } from './pages/auth/InviteAcceptPage'
import { DashboardPage } from './pages/hr/DashboardPage'
import { CandidatesPage } from './pages/hr/CandidatesPage'
import { RolesPage } from './pages/hr/RolesPage'
import { InterviewsPage } from './pages/hr/InterviewsPage'
import { SettingsPage } from './pages/hr/SettingsPage'
import { InterviewerDashboardPage } from './pages/interviewer/InterviewerDashboardPage'
import { RouteErrorState } from './components/shared/RouteErrorState'

function ProtectedRoute({ role }: { role: 'hr' | 'interviewer' }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (role === 'hr' && user.role === 'interviewer') return <Navigate to="/interviewer" replace />
  if (role === 'interviewer' && user.role !== 'interviewer') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace />, errorElement: <RouteErrorState /> },
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorState /> },
  { path: '/invite/:token', element: <InviteAcceptPage />, errorElement: <RouteErrorState /> },
  {
    element: <ProtectedRoute role="hr" />,
    errorElement: <RouteErrorState />,
    children: [{
      element: <AppShell />,
      errorElement: <RouteErrorState />,
      children: [
        { path: '/dashboard', element: <DashboardPage />, errorElement: <RouteErrorState /> },
        { path: '/candidates', element: <CandidatesPage />, errorElement: <RouteErrorState /> },
        { path: '/roles', element: <RolesPage />, errorElement: <RouteErrorState /> },
        { path: '/interviews', element: <InterviewsPage />, errorElement: <RouteErrorState /> },
        { path: '/settings', element: <SettingsPage />, errorElement: <RouteErrorState /> },
      ],
    }],
  },
  {
    element: <ProtectedRoute role="interviewer" />,
    errorElement: <RouteErrorState />,
    children: [{ element: <AppShell />, errorElement: <RouteErrorState />, children: [{ path: '/interviewer', element: <InterviewerDashboardPage />, errorElement: <RouteErrorState /> }] }],
  },
])

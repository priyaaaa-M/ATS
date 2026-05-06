import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import { Button } from '../ui/button'

export function RouteErrorState() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Something unexpected happened.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-6">
      <div className="w-full max-w-lg rounded-[16px] border bg-[var(--bg-card)] p-8 text-center">
        <p className="text-lg font-semibold text-[var(--text-1)]">Something went wrong</p>
        <p className="mt-3 text-sm text-[var(--text-2)]">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  )
}

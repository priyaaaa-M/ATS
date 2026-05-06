import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export function LoginPage() {
  const goGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  return (
    <div className="grid min-h-screen md:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col justify-between bg-[var(--bg-sidebar)] p-10 text-white">
        <div>
          <p className="text-4xl font-bold">Hire smarter.</p>
          <p className="mt-3 max-w-md text-sm text-[var(--text-sb)]">Run a fast, structured hiring loop for every role, every round, and every interviewer.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {['Structured pipelines', 'Shared scorecards', 'Live scheduling'].map((chip) => (
            <span key={chip} className="rounded-full border border-[var(--border-sb)] px-3 py-2 text-xs text-[var(--text-sb)]">{chip}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h1 className="text-[22px] font-bold">Welcome back</h1>
          <p className="mt-2 text-[13px] text-[var(--text-2)]">Sign in to continue</p>
          <Button className="mt-8 h-12 w-full" onClick={goGoogle}>Continue with Google</Button>
          <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-3)]"><div className="h-px flex-1 bg-[var(--border)]" />or<div className="h-px flex-1 bg-[var(--border)]" /></div>
          <div className="space-y-3">
            <Input placeholder="Email address" />
            <Input placeholder="Password" type="password" />
            <Button className="h-12 w-full" onClick={goGoogle}>Sign in</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

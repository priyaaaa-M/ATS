'use client'

import type { FormEvent } from 'react'
import { useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(user?.role === 'interviewer' ? '/interviewer' : '/dashboard')
    }
  }, [isAuthenticated, isLoading, router, user?.role])

  function handleGoogleLogin() {
    authApi.loginWithGoogle()
  }

  function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    authApi.loginWithGoogle()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_35%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--surface-2)))] px-4">
      <Card className="w-full max-w-md border-border bg-surface shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="font-[Syne] text-2xl">ATS Login</CardTitle>
            <CardDescription>Continue with Google to access your hiring workspace.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleEmailLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

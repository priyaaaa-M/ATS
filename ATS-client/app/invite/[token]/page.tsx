'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { authApi, inviteApi } from '@/lib/api'

export default function InvitePage() {
  const params = useParams()
  const token = params.token as string

  const {
    data: invite,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => inviteApi.validateToken(token),
    enabled: Boolean(token),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md" />
      </div>
    )
  }

  if (isError || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invite Unavailable</CardTitle>
            <CardDescription>This invite is invalid, expired, or already used.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.15),transparent_35%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--surface-2)))] px-4">
      <Card className="w-full max-w-md border-border bg-surface shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="font-[Syne] text-2xl">Interview Invite</CardTitle>
          <CardDescription>Join as an interviewer for the selected round.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <p><strong>Role:</strong> {invite.role_name}</p>
            <p><strong>Round:</strong> {invite.round_number}</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {invite.email}</p>
          </div>
          <Button className="w-full" onClick={() => authApi.loginWithGoogle(token)}>
            Accept and Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

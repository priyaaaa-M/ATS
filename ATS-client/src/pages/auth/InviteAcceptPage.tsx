import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { inviteApi } from '../../api'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Avatar } from '../../components/shared/Avatar'

export function InviteAcceptPage() {
  const { token = '' } = useParams()
  const { data, isError } = useQuery({ queryKey: ['invite', token], queryFn: () => inviteApi.validate(token) })

  if (isError) {
    return <div className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-lg border-[var(--error)] bg-[var(--error-light)]"><CardContent className="pt-6"><p className="text-lg font-semibold text-[var(--error)]">This invite has expired</p></CardContent></Card></div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-6">
      <Card className="w-full max-w-xl">
        <CardContent className="pt-6">
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={data?.company?.name} size="lg" />
            <div>
              <p className="text-xl font-semibold">You've been invited</p>
              <p className="text-sm text-[var(--text-2)]">Join {data?.company?.name ?? 'the hiring team'} for round {data?.roundNumber}</p>
            </div>
          </div>
          <div className="mb-6 flex gap-2">
            <span className="rounded-full bg-[var(--brand-light)] px-3 py-1 text-xs text-[var(--brand)]">{data?.roleName}</span>
            <span className="rounded-full bg-[var(--bg-hover)] px-3 py-1 text-xs text-[var(--text-2)]">Round {data?.roundNumber}</span>
          </div>
          <p className="text-sm text-[var(--text-2)]">Accept this invite to access candidate details, scheduling, and feedback tools for your assigned interview round.</p>
          <Button className="mt-6 w-full" onClick={() => { sessionStorage.setItem('pendingInviteToken', token); window.location.href = `${import.meta.env.VITE_API_URL}/auth/google?inviteToken=${token}` }}>Accept & Login with Google</Button>
        </CardContent>
      </Card>
    </div>
  )
}

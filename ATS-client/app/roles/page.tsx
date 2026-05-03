'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Plus, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { rolesApi } from '@/lib/api'

export default function RolesPage() {
  const { data: roles = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['role-details'],
    queryFn: rolesApi.list,
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-[Syne] text-2xl font-bold text-foreground">Roles</h1>
            <p className="text-muted-foreground">Manage open positions and interview pipelines</p>
          </div>
          <Button asChild>
            <Link href="/roles/new">
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-56 bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Failed to load roles.
            <Button variant="link" onClick={() => refetch()} className="px-2">
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="border-border bg-surface">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{role.title || role.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{role.status || 'open'}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{role.candidateCount || 0} candidates</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{role.description || 'No description yet.'}</p>
                  <div className="flex flex-wrap gap-2">
                    {(role.workTags || []).slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {role.hiringManagerName || 'Unassigned'}
                    </span>
                    <span>{role.createdAt ? new Date(role.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/roles/${role.id}`}>View Role</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/roles/${role.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

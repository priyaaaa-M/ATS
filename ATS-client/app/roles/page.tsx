'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Plus, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { candidatesApi, rolesApi } from '@/lib/api'

export default function RolesPage() {
  const { data: roles = [] } = useQuery({
    queryKey: ['roles-page'],
    queryFn: rolesApi.list,
  })
  const { data: candidates = [] } = useQuery({
    queryKey: ['roles-page-candidates'],
    queryFn: () => candidatesApi.list(),
  })

  const roleStats = useMemo(
    () =>
      roles.map((role) => {
        const roleCandidates = candidates.filter((candidate) => candidate.role === role.name)
        const selected = roleCandidates.filter((candidate) => candidate.status === 'selected').length
        return {
          name: role.name,
          openings: Math.max(roleCandidates.length, 1),
          applications: roleCandidates.length,
          selected,
        }
      }),
    [candidates, roles]
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-[Syne] text-2xl font-bold text-foreground flex items-center gap-3">
              Roles
              <Badge className="bg-primary text-primary-foreground">
                {roleStats.length}
              </Badge>
            </h1>
            <p className="text-muted-foreground">Manage open positions</p>
          </div>
          <Button className="bg-primary text-primary-foreground" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Managed in Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleStats.map((role) => (
            <Card key={role.name} className="bg-surface border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{role.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{role.openings} openings</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Applications
                    </span>
                    <span className="text-foreground font-medium">{role.applications}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-foreground">{role.selected}/{role.openings} filled</span>
                    </div>
                    <Progress 
                      value={(role.selected / role.openings) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

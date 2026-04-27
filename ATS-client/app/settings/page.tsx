'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Building2, Link2, Settings, UserPlus, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/layout/app-shell'
import { CompanyProfile } from '@/components/settings/company-profile'
import { IntegrationsPanel } from '@/components/settings/integrations-panel'
import { InvitePanel } from '@/components/settings/invite-panel'
import { RoundsPanel } from '@/components/settings/rounds-panel'
import { ThemeToggle } from '@/components/providers/theme-provider'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'company'
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[Syne] text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage company settings, integrations, rounds, and invites.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="company" 
              className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Company Profile
            </TabsTrigger>
            <TabsTrigger 
              value="integrations"
              className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger 
              value="rounds"
              className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              Interview Rounds
            </TabsTrigger>
            <TabsTrigger 
              value="invite"
              className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Interviewers
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <CompanyProfile />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsPanel />
          </TabsContent>

          <TabsContent value="rounds">
            <RoundsPanel />
          </TabsContent>

          <TabsContent value="invite">
            <InvitePanel />
          </TabsContent>

          <TabsContent value="preferences">
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Appearance
                </h2>
                <ThemeToggle />
              </div>
              
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
                <p className="text-muted-foreground text-sm">
                  Notification preferences coming soon.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { CompanyProfileTab } from './settings/CompanyProfileTab'
import { InterviewRoundsTab } from './settings/InterviewRoundsTab'
import { IntegrationsTab } from './settings/IntegrationsTab'
import { InviteInterviewersTab } from './settings/InviteInterviewersTab'

export function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-1 text-[var(--text-1)]">Settings</h1>
      <p className="text-[var(--text-2)] text-sm mb-6">
        Manage your company profile, integrations, and interview workflows.
      </p>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="w-full gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2">
          <TabsTrigger
            value="company"
            className="rounded-lg border-b-0 px-4 py-2 data-[state=active]:bg-[var(--bg-hover)] data-[state=active]:text-[var(--text-1)]"
          >
            Company Profile
          </TabsTrigger>
          <TabsTrigger
            value="rounds"
            className="rounded-lg border-b-0 px-4 py-2 data-[state=active]:bg-[var(--bg-hover)] data-[state=active]:text-[var(--text-1)]"
          >
            Interview Rounds
          </TabsTrigger>
          <TabsTrigger
            value="invite"
            className="rounded-lg border-b-0 px-4 py-2 data-[state=active]:bg-[var(--bg-hover)] data-[state=active]:text-[var(--text-1)]"
          >
            Invite Interviewers
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-lg border-b-0 px-4 py-2 data-[state=active]:bg-[var(--bg-hover)] data-[state=active]:text-[var(--text-1)]"
          >
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyProfileTab />
        </TabsContent>
        <TabsContent value="rounds">
          <InterviewRoundsTab />
        </TabsContent>
        <TabsContent value="invite">
          <InviteInterviewersTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

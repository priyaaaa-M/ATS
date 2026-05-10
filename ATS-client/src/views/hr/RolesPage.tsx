import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Plus, Filter, Search, Loader2 } from 'lucide-react'
import { useRoles } from '../../hooks/useRoles'
import { rolesApi } from '../../api'
import { RoleCard } from '../../components/roles/RoleCard'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import type { Role } from '../../types'

export function RolesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: roles = [], refetch } = useRoles()
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'draft' | 'paused'>('all')
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [search, setSearch] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRoleTitle, setNewRoleTitle] = useState('')
  const [criteria, setCriteria] = useState<
    Array<{ id?: string; question: string; type?: 'yes_no' | 'scale'; required?: boolean }>
  >([])

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.create(newRoleTitle),
    onSuccess: async () => {
      toast.success('Role created successfully')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      refetch()
      setIsCreateModalOpen(false)
      setNewRoleTitle('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not create role')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ roleName, status }: { roleName: string; status: string }) =>
      rolesApi.updateStatus(roleName, status),
    onSuccess: () => {
      toast.success('Role status updated')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      refetch()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not update status')
    },
  })

  useEffect(() => {
    setCriteria(activeRole?.screeningQuestions || [])
  }, [activeRole])

  const filters = ['all', 'open', 'draft', 'paused'] as const
  const visible = useMemo(
    () =>
      roles.filter(
        (role) => 
          (activeFilter === 'all' || (role.status ?? 'open') === activeFilter) &&
          (search === '' || role.title.toLowerCase().includes(search.toLowerCase()) || role.name.toLowerCase().includes(search.toLowerCase()))
      ),
    [activeFilter, roles, search]
  )

  const saveCriteriaMutation = useMutation({
    mutationFn: () =>
      rolesApi.updateScreeningQuestions(
        activeRole!.name,
        criteria.filter((criterion) => criterion.question.trim())
      ),
    onSuccess: async () => {
      toast.success('Screening criteria updated')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (activeRole) {
        await queryClient.invalidateQueries({
          queryKey: ['screening-questions', activeRole.name],
        })
      }
      setActiveRole(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not save screening criteria')
    },
  })

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Open Roles</h1>
          <p className="text-muted-foreground text-sm">Manage job postings and screening criteria.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand transition-colors" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted border-border text-white placeholder:text-muted-foreground focus:ring-brand focus:border-brand transition-all w-64 rounded-xl" 
              placeholder="Search roles..." 
            />
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary-glow rounded-xl font-medium gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Role</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border border-border">
          <div className="px-3 py-1 flex items-center text-muted-foreground text-xs font-semibold uppercase tracking-widest border-r border-border">
            <Filter className="h-3 w-3 mr-1.5" /> Filter
          </div>
          {filters.map((filter) => {
            const count = roles.filter((role) => filter === 'all' || (role.status ?? 'open') === filter).length
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative px-4 py-1.5 text-sm font-medium transition-all rounded-lg ${
                  activeFilter === filter
                    ? 'text-white bg-accent shadow-sm'
                    : 'text-muted-foreground hover:text-white hover:bg-muted'
                }`}
              >
                <span className="capitalize">{filter}</span>
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeFilter === filter ? 'bg-brand text-white' : 'bg-accent'
                }`}>
                  {count}
                </span>
                {activeFilter === filter && (
                  <motion.div layoutId="activeFilterBg" className="absolute inset-0 bg-accent rounded-lg -z-10" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <motion.div 
        className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        <AnimatePresence>
          {visible.length ? (
            visible.map((role) => (
              <motion.div 
                key={role.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <div className="glass-card h-full transition-all hover:bg-accent/80">
                  <RoleCard
                    role={role}
                    onView={() => navigate(`/roles/${encodeURIComponent(role.name)}`)}
                    onEditCriteria={() => setActiveRole(role)}
                    onStatusChange={(status) => {
                      console.log('CLICKED STATUS:', status, 'for', role.name)
                      toast.info(`Updating ${role.name} to ${status}...`)
                      updateStatusMutation.mutate({ roleName: role.name, status })
                    }}
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="col-span-full"
            >
              <div className="flex flex-col items-center justify-center p-12 text-center glass-card border-dashed">
                <Briefcase className="h-12 w-12 text-brand/30 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-1">No roles found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                <Button variant="outline" className="mt-6 bg-muted border-border text-white rounded-xl" onClick={() => { setSearch(''); setActiveFilter('all') }}>
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* New Role Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-white/10 text-white glass-card">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new job position to your ATS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">Role Title</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Product Designer"
                value={newRoleTitle}
                onChange={(e) => setNewRoleTitle(e.target.value)}
                className="bg-muted border-border text-white placeholder:text-muted-foreground focus:ring-brand focus:border-brand rounded-xl h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className="rounded-xl text-muted-foreground hover:text-white hover:bg-accent"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="btn-primary-glow rounded-xl"
              onClick={() => createRoleMutation.mutate()}
              disabled={!newRoleTitle.trim() || createRoleMutation.isPending}
            >
              {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activeRole)} onOpenChange={(open) => !open && setActiveRole(null)}>
        <DialogContent className="max-w-2xl bg-background border-border text-foreground glass-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">{activeRole?.title || activeRole?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add screening criteria so recruiters can use scorecards for this role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 my-4">
            <div className="flex items-center justify-between bg-muted p-4 rounded-xl border border-border">
              <div>
                <h3 className="text-sm font-semibold text-white">Screening Criteria</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Define what makes a good candidate</p>
              </div>
              <Button
                type="button"
                className="bg-brand/10 text-brand hover:bg-brand/20 hover:text-brand border-brand/20 rounded-xl transition-colors"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCriteria((current) => [...current, { question: '', type: 'yes_no', required: false }])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add Criterion
              </Button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {criteria.map((criterion, index) => (
                  <motion.div
                    key={criterion.id || index}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3 group"
                  >
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-[10px] font-bold text-muted-foreground group-hover:bg-brand group-hover:text-white transition-colors">
                      {index + 1}
                    </div>
                    <Input
                      placeholder="e.g. 5+ years experience in role"
                      value={criterion.question}
                      onChange={(event) =>
                        setCriteria((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, question: event.target.value } : item
                          )
                        )
                      }
                      className="flex-1 bg-transparent border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {criteria.length === 0 && (
                <div className="py-8 text-center border border-dashed border-border rounded-xl bg-card">
                  <p className="text-sm text-muted-foreground">
                    No screening criteria yet. Add criteria to enable scorecards for this role.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 mt-2">
            <Button variant="ghost" className="rounded-xl text-muted-foreground hover:text-white hover:bg-accent" onClick={() => setActiveRole(null)}>
              Cancel
            </Button>
            <Button
              className="btn-primary-glow rounded-xl"
              onClick={() => saveCriteriaMutation.mutate()}
              disabled={saveCriteriaMutation.isPending}
            >
              Save Criteria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

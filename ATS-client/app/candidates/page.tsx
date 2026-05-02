'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, MoreHorizontal, Mail, Briefcase, Star, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { candidatesApi } from '@/lib/api/candidates'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/app-shell'
import { motion, AnimatePresence } from 'framer-motion'
import { NewCandidateDialog } from '@/components/candidates/new-candidate-dialog'

const statuses = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'AI Parsing', color: 'purple' },
  { id: 'hr_approved', label: 'HR Review', color: 'amber' },
  { id: 'scheduled', label: 'Interviews', color: 'blue' },
  { id: 'selected', label: 'Selected', color: 'emerald' },
  { id: 'rejected', label: 'Rejected', color: 'rose' },
]

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('all')
  const [isNewCandidateOpen, setIsNewCandidateOpen] = useState(false)

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidatesApi.list(),
  })

  const filteredCandidates = useMemo(() => candidates.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = activeStatus === 'all' || c.status === activeStatus
    
    return matchesSearch && matchesStatus
  }), [candidates, searchQuery, activeStatus])

  const getStageStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      case 'hr_approved': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'selected': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'rejected': return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      default: return 'bg-secondary text-muted-foreground'
    }
  }

  return (
    <AppShell>
      <div className="px-6 md:px-8 space-y-8 pb-10">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground">
              Candidate <span className="text-muted-foreground/40 font-medium">Database</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg">Manage and track your applicant pipeline.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-full bg-card shadow-sm h-14 px-8 font-bold text-[14px] hover:shadow-md transition-all">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
            <Button className="rounded-full bg-[#09090B] dark:bg-white text-white dark:text-black shadow-xl h-14 px-8 font-bold text-[14px] hover:scale-105 transition-all">
              Export CSV
            </Button>
            <Button 
              onClick={() => setIsNewCandidateOpen(true)}
              className="rounded-full bg-primary text-primary-foreground shadow-xl h-14 px-8 font-bold text-[14px] hover:scale-105 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>

        {/* Toolbar: Search and Status Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3 bg-card rounded-[2.5rem] shadow-premium">
          <div className="relative flex-1 max-w-md ml-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
            <Input
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-secondary/10 border-transparent focus:bg-background focus:border-primary/20 rounded-full text-[14px] font-medium"
            />
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-secondary/5 rounded-full overflow-x-auto scrollbar-none">
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStatus(s.id)}
                className={cn(
                  "whitespace-nowrap px-6 py-3 text-[13px] font-black rounded-full transition-all",
                  activeStatus === s.id 
                    ? "bg-foreground text-background shadow-lg" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
                <span className={cn(
                  "ml-2 opacity-40 text-[11px]",
                  activeStatus === s.id ? "text-background" : "text-muted-foreground"
                )}>
                  {s.id === 'all' ? candidates.length : candidates.filter(c => c.status === s.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-card rounded-[2.5rem] shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/10">
                  <th className="text-left py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Candidate</th>
                  <th className="text-left py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Role</th>
                  <th className="text-left py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">ATS Match</th>
                  <th className="text-left py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Status</th>
                  <th className="text-left py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Activity</th>
                  <th className="py-6 px-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="py-8 px-8 border-b border-border/5">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-secondary/20" />
                             <div className="space-y-2">
                               <div className="h-5 w-48 bg-secondary/20 rounded-full" />
                               <div className="h-3 w-32 bg-secondary/20 rounded-full" />
                             </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredCandidates.map((c, idx) => (
                    <motion.tr 
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-secondary/5 transition-colors group cursor-pointer border-b border-border/5 last:border-0"
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center text-[15px] font-black shadow-lg shadow-black/5">
                            {c.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[15px] font-black text-foreground group-hover:text-primary transition-colors tracking-tight">{c.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground/60">
                              <Mail className="h-3 w-3" />
                              <span className="text-[12px] font-bold truncate">{c.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-secondary/10 group-hover:bg-primary/10 transition-colors">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary" />
                          </div>
                          <span className="text-[14px] font-black text-foreground tracking-tight">
                            {c.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-secondary/20 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${c.ats_score || 70}%` }}
                              className={cn(
                                "h-full rounded-full",
                                (c.ats_score || 70) >= 85 ? "bg-emerald-500" : (c.ats_score || 70) >= 70 ? "bg-amber-500" : "bg-rose-500"
                              )} 
                            />
                          </div>
                          <span className={cn(
                            "text-[13px] font-black tracking-tighter",
                            (c.ats_score || 70) >= 85 ? "text-emerald-500" : (c.ats_score || 70) >= 70 ? "text-amber-500" : "text-rose-500"
                          )}>
                            {c.ats_score || 70}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <Badge variant="secondary" className={cn("rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em]", getStageStyle(c.status).replace(/border-[a-z]+-500\/20/g, ''))}>
                          {statuses.find(s => s.id === c.status)?.label || c.status}
                        </Badge>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-foreground">2h ago</span>
                          <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider">Applied</span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/10 hover:bg-primary/10 hover:text-primary">
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {!isLoading && filteredCandidates.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-card rounded-[1.5rem] shadow-premium"
          >
            <div className="h-16 w-16 bg-secondary/30 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No candidates found</h3>
            <p className="text-muted-foreground font-medium mt-1">Try adjusting your search or filters.</p>
            <Button 
              variant="link" 
              onClick={() => { setSearchQuery(''); setActiveStatus('all'); }}
              className="mt-2 text-primary font-bold"
            >
              Clear all filters
            </Button>
          </motion.div>
        )}
      </div>
      <NewCandidateDialog 
        open={isNewCandidateOpen} 
        onOpenChange={setIsNewCandidateOpen} 
      />
    </AppShell>
  )
}

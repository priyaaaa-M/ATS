'use client'

import { Mail, Phone, Briefcase, MoreVertical, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Candidate } from '@/lib/types'
import Link from 'next/link'

interface CandidateCardProps {
  candidate: Candidate
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  hr_approved: 'bg-info/20 text-info border-info/30',
  scheduled: 'bg-primary/20 text-primary border-primary/30',
  selected: 'bg-success/20 text-success border-success/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  hr_approved: 'Approved',
  scheduled: 'Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
}

const roleColors: Record<string, string> = {
  'Backend Engineer': 'hsl(200, 70%, 50%)',
  'Frontend Engineer': 'hsl(150, 70%, 45%)',
  'DevOps Engineer': 'hsl(30, 70%, 50%)',
  'Full Stack': 'hsl(280, 70%, 55%)',
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-success text-white'
  if (score >= 70) return 'bg-primary text-primary-foreground'
  if (score >= 50) return 'bg-warning text-white'
  return 'bg-destructive text-white'
}

export function CandidateCard({ candidate, onApprove, onReject }: CandidateCardProps) {
  const initials = candidate.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const avatarColor = roleColors[candidate.role] || 'hsl(var(--primary))'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/candidates/${candidate.id}`}>
        <Card className="group cursor-pointer bg-surface border-border hover:border-primary/40 transition-all">
          <CardContent className="p-4">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback 
                    className="text-white font-medium"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Badge 
                  variant="outline" 
                  className={cn('text-[10px]', statusColors[candidate.status])}
                >
                  {statusLabels[candidate.status]}
                </Badge>
              </div>
              <Badge className={cn('text-xs font-mono', getScoreColor(candidate.ats_score))}>
                {candidate.ats_score}
              </Badge>
            </div>

            {/* Info */}
            <div className="space-y-1.5 mb-3">
              <h3 className="font-[Syne] font-semibold text-foreground group-hover:text-primary transition-colors">
                {candidate.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>{candidate.role}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{candidate.phone}</span>
              </div>
            </div>

            {/* Round Progress */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">
                Round {candidate.current_round} of {candidate.total_rounds}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: candidate.total_rounds }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      i < candidate.current_round - 1
                        ? 'bg-success'
                        : i === candidate.current_round - 1
                        ? 'bg-primary'
                        : 'bg-border'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
              {candidate.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => onApprove?.(candidate.id)}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onReject?.(candidate.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {candidate.status !== 'pending' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 border-border hover:bg-surface-2"
                >
                  View Profile
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="px-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-surface border-border">
                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Send Email</DropdownMenuItem>
                  <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

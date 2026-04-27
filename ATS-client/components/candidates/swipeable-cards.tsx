'use client'

import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Mail, Phone, Briefcase, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Candidate } from '@/lib/types'
import Link from 'next/link'

interface SwipeableCardsProps {
  candidates: Candidate[]
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

export function SwipeableCards({ candidates, onApprove, onReject }: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const goToNext = () => {
    if (currentIndex < candidates.length - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  })

  if (candidates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No candidates found
      </div>
    )
  }

  const candidate = candidates[currentIndex]
  const initials = candidate.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
  const avatarColor = roleColors[candidate.role] || 'hsl(var(--primary))'

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="space-y-4">
      {/* Card Counter */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {candidates.length}
        </span>
        <div className="flex gap-1">
          {candidates.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 w-6 rounded-full transition-colors',
                idx === currentIndex ? 'bg-primary' : 'bg-border'
              )}
            />
          ))}
          {candidates.length > 10 && (
            <span className="text-xs text-muted-foreground ml-1">+{candidates.length - 10}</span>
          )}
        </div>
      </div>

      {/* Swipeable Area */}
      <div {...handlers} className="relative overflow-hidden touch-pan-y">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <Link href={`/candidates/${candidate.id}`}>
              <Card className="bg-surface border-border">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback 
                          className="text-white text-lg font-medium"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-[Syne] text-lg font-semibold text-foreground">
                          {candidate.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{candidate.role}</p>
                        <Badge 
                          variant="outline" 
                          className={cn('text-[10px] mt-1', statusColors[candidate.status])}
                        >
                          {statusLabels[candidate.status]}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={cn('text-sm font-mono', getScoreColor(candidate.ats_score))}>
                      {candidate.ats_score}
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>{candidate.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{candidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{candidate.phone}</span>
                    </div>
                  </div>

                  {/* Round Progress */}
                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-surface-2">
                    <span className="text-sm text-foreground">
                      Round {candidate.current_round} of {candidate.total_rounds}
                    </span>
                    <div className="flex gap-2">
                      {Array.from({ length: candidate.total_rounds }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-2.5 w-2.5 rounded-full',
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

                  {/* Skills Preview */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {candidate.parsed_data.skills.slice(0, 4).map((skill) => (
                      <Badge 
                        key={skill.name} 
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          skill.level === 'expert' 
                            ? 'bg-primary/20 text-primary' 
                            : skill.level === 'intermediate'
                            ? 'bg-surface-3 text-foreground'
                            : 'bg-surface-2 text-muted-foreground'
                        )}
                      >
                        {skill.name}
                      </Badge>
                    ))}
                    {candidate.parsed_data.skills.length > 4 && (
                      <Badge variant="secondary" className="text-xs bg-surface-2">
                        +{candidate.parsed_data.skills.length - 4}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3" onClick={(e) => e.preventDefault()}>
                    {candidate.status === 'pending' && (
                      <>
                        <Button 
                          className="flex-1 bg-primary text-primary-foreground"
                          onClick={() => onApprove?.(candidate.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => onReject?.(candidate.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {candidate.status !== 'pending' && (
                      <Button className="w-full bg-primary text-primary-foreground">
                        View Full Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between px-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="h-10 w-10 border-border"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <span className="text-xs text-muted-foreground">
          Swipe left/right to navigate
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={currentIndex === candidates.length - 1}
          className="h-10 w-10 border-border"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

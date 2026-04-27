'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu,
  LayoutDashboard, 
  Users2, 
  Briefcase, 
  CalendarDays, 
  Settings2, 
  CheckCircle2,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/auth-store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const hrNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users2, label: 'Candidates', href: '/candidates', count: 20 },
  { icon: Briefcase, label: 'Roles', href: '/roles' },
  { icon: CalendarDays, label: 'Interviews', href: '/interviews' },
  { icon: Settings2, label: 'Settings', href: '/settings' },
  { icon: CheckCircle2, label: 'Selected', href: '/selected', count: 3 },
]

const interviewerNavItems = [
  { icon: Users2, label: 'My Candidates', href: '/interviewer' },
  { icon: CalendarDays, label: 'My Schedule', href: '/schedule' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, company, logout } = useAuthStore()
  
  const navItems = user?.role === 'interviewer' ? interviewerNavItems : hrNavItems
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      setOpen(false)
      router.push('/login')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-surface border-border p-0">
        {/* Company Logo Section */}
        <div className="flex items-center gap-3 p-4">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-full text-brand-foreground font-semibold text-lg"
            style={{ backgroundColor: company?.brand_color || 'hsl(var(--brand))' }}
          >
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              getInitials(company?.name || 'TC')
            )}
          </div>
          <div>
            <h2 className="font-[Syne] text-[15px] font-semibold text-foreground">{company?.name || 'TechCorp'}</h2>
            <p className="text-[11px] text-muted-foreground">ATS Platform</p>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary border-l-[3px] border-primary'
                        : 'text-muted-foreground hover:bg-surface-3 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    <span className="flex-1">{item.label}</span>
                    {item.count && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs',
                          isActive && 'bg-primary/20 text-primary'
                        )}
                      >
                        {item.count}
                      </Badge>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback 
                className="text-brand-foreground text-sm"
                style={{ backgroundColor: company?.brand_color || 'hsl(var(--brand))' }}
              >
                {getInitials(user?.name || 'PS')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Priya Sharma'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@techcorp.com'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              void handleLogout()
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

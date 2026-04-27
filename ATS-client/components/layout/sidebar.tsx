'use client'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users2, 
  Briefcase, 
  CalendarDays, 
  Settings2, 
  CheckCircle2,
  Bell,
  ChevronUp,
  LogOut,
  User,
  Keyboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/auth-store'
import { authApi } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

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

export function Sidebar() {
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
      router.push('/login')
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-border bg-surface md:flex">
      {/* Company Logo Section */}
      <div className="flex items-center gap-3 p-4 group">
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
        <div className="flex-1">
          <h2 className="font-[Syne] text-[15px] font-semibold text-foreground">{company?.name || 'TechCorp'}</h2>
          <p className="text-[11px] text-muted-foreground">ATS Platform</p>
        </div>
        <Link 
          href="/settings" 
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-2 rounded"
        >
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <Separator className="bg-border" />

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <motion.ul 
          className="space-y-1"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <motion.li
                key={item.href}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <Link
                  href={item.href}
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
              </motion.li>
            )
          })}
        </motion.ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between mb-3">
          <button className="relative p-2 hover:bg-surface-2 rounded-lg transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-surface-2 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback 
                  className="text-brand-foreground text-sm"
                  style={{ backgroundColor: company?.brand_color || 'hsl(var(--brand))' }}
                >
                  {getInitials(user?.name || 'PS')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Priya Sharma'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@techcorp.com'}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-surface border-border" align="end" side="top">
            <Link 
              href="/settings?tab=profile" 
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2">
              <Keyboard className="h-4 w-4" />
              Keyboard shortcuts
            </button>
            <Separator className="my-1 bg-border" />
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  )
}

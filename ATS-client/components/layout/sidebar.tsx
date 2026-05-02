'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Layers,
  Users,
  Calendar,
  Settings,
  Triangle,
  LogOut,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/auth-store'
import { useThemeStore } from '@/lib/store/theme-store'
import { useLayoutStore } from '@/lib/store/layout-store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { NewCandidateDialog } from '../candidates/new-candidate-dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface NavItem {
  icon: any
  label: string
  href: string
  count?: number
  hasDot?: boolean
}

const navItems: NavItem[] = [
  { icon: Layers, label: 'Pipeline', href: '/dashboard' },
  { icon: Users, label: 'Candidates', href: '/candidates', count: 142 },
  { icon: Calendar, label: 'Interviews', href: '/interviews', count: 7 },
  { icon: Triangle, label: 'Drive Sync', href: '/drive', hasDot: true },
]

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { setMode, resolvedTheme } = useThemeStore()
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore()
  const [mounted, setMounted] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      router.push('/login')
    }
  }

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 }
  }

  return (
    <motion.aside 
      initial={false}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-2 top-2 bottom-2 z-40 hidden flex-col bg-sidebar rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.1)] md:flex overflow-hidden"
    >
      <div className="flex h-20 items-center justify-between px-6">
        {!sidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-xl bg-sidebar-foreground/10 flex items-center justify-center">
              <Triangle className="h-5 w-5 text-sidebar-foreground fill-sidebar-foreground" />
            </div>
            <h1 className="text-[18px] font-black tracking-tight text-sidebar-foreground">
              HireOS
            </h1>
          </motion.div>
        )}
        <button 
          onClick={toggleSidebar}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sidebar-foreground hover:bg-white/10 hover:text-white transition-all",
            sidebarCollapsed && "mx-auto"
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* "New Candidate" Button Section */}
      <div className="px-4 mb-6">
        <Button 
          onClick={() => setIsNewDialogOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 shadow-xl rounded-full h-14 transition-all cursor-pointer group/btn active:scale-[0.98]",
            sidebarCollapsed ? "justify-center px-0 h-12 w-12 mx-auto" : "px-6"
          )}
        >
          <div className="flex h-5 w-5 items-center justify-center">
            <Plus className={cn("h-5 w-5 stroke-[3]", !sidebarCollapsed && "mr-1")} />
          </div>
          {!sidebarCollapsed && <span className="text-[14px] font-black tracking-tight uppercase">NEW CANDIDATE</span>}
        </Button>
      </div>

      {/* Navigation Items (Flat list, no headers) */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px] transition-all duration-200',
                isActive
                  ? 'bg-sidebar-foreground/10 text-sidebar-foreground font-bold shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground',
                sidebarCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
              )}
            >
              <item.icon 
                className={cn(
                  'h-[18px] w-[18px] transition-all duration-200', 
                  isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground'
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 truncate">
                    {item.label}
                  </span>
                  
                  {item.count && (
                    <span className={cn(
                      "text-[11px] font-bold opacity-60",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.count}
                    </span>
                  )}
                  
                  {item.hasDot && (
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-3 py-6 space-y-1">
        {/* Notifications Row */}
        <button className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sidebar-foreground/70 hover:bg-white/5 hover:text-white transition-all",
          sidebarCollapsed && "justify-center"
        )}>
          <Bell className="h-5 w-5" strokeWidth={2} />
          {!sidebarCollapsed && <span className="text-[14px] font-medium">Notifications</span>}
        </button>

        {/* Theme Dropdown Row */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sidebar-foreground hover:bg-white/5 hover:text-white transition-all outline-none",
                sidebarCollapsed && "justify-center"
              )}
            >
              {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {!sidebarCollapsed && <span className="text-[14px] font-medium">Theme</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align={sidebarCollapsed ? "center" : "start"} 
            side={sidebarCollapsed ? "right" : "bottom"} 
            className="w-44 rounded-xl p-1.5 shadow-2xl bg-sidebar border border-sidebar-border text-sidebar-foreground"
          >
            <DropdownMenuItem 
              onClick={() => setMode('light')}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold cursor-pointer hover:bg-sidebar-foreground/10 focus:bg-sidebar-foreground/10"
            >
              <Sun className="h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setMode('dark')}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold cursor-pointer hover:bg-sidebar-foreground/10 focus:bg-sidebar-foreground/10"
            >
              <Moon className="h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setMode('system')}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold cursor-pointer hover:bg-sidebar-foreground/10 focus:bg-sidebar-foreground/10"
            >
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Merged Profile & Settings Item */}
        <div 
          onClick={() => router.push('/settings')}
          className={cn(
            "mt-4 flex items-center gap-3 px-3 py-3 rounded-[24px] bg-sidebar-foreground/5 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all cursor-pointer group",
            sidebarCollapsed && "justify-center px-0 h-12 w-12 mx-auto"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-foreground text-sidebar font-black text-[12px]">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'PM'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-sidebar-foreground truncate">{user?.name || 'Priya Mandal'}</p>
              <p className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Admin</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="p-2 rounded-full text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <NewCandidateDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />
    </motion.aside>
  )
})

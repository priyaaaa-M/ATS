import { Briefcase, Calendar, LayoutDashboard, Settings, Users, Sparkles, LogOut, Moon, Sun, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useLayoutStore } from '../../store/layoutStore'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import { Avatar } from '../shared/Avatar'
import { cn } from '../../lib/utils'

export function Sidebar({ candidateCount = 0, openRoles = 0 }: { candidateCount?: number; openRoles?: number }) {
  const { user, company } = useAuth()
  const logout = useAuthStore((state) => state.logout)
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)
  const isCollapsed = useLayoutStore((state) => state.isCollapsed)
  const toggleCollapse = useLayoutStore((state) => state.toggleCollapse)

  const items = user?.role === 'interviewer'
    ? [{ label: 'My Candidates', path: '/interviewer', icon: Users, count: candidateCount }]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Candidates', path: '/candidates', icon: Users, count: candidateCount },
        { label: 'Roles', path: '/roles', icon: Briefcase, count: openRoles },
        { label: 'Interviews', path: '/interviews', icon: Calendar },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex h-screen flex-col bg-[#F9FAFB] dark:bg-[#050505] border-r border-border relative z-50 overflow-visible shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]"
    >
      {/* 1. TOP BRAND SECTION */}
      <div className={cn("flex items-center pt-8 pb-6 px-5 border-b border-border/50", isCollapsed ? "justify-center" : "justify-between gap-4")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-4")}>
          <div className="relative flex-shrink-0">
            <Avatar name={company?.name} imageUrl={company?.logoUrl} size="lg" className="h-12 w-12 text-[14px] ring-1 ring-border shadow-md" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-background rounded-full flex items-center justify-center border border-border">
              <Sparkles className="h-3 w-3 text-brand" />
            </div>
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap">
              <p className="text-[16px] font-bold text-foreground tracking-tight">{company?.name ?? 'Confido ATS'}</p>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Hiring Platform</p>
            </motion.div>
          )}
        </div>
        
        {/* Collapse Button */}
        <button 
          onClick={toggleCollapse} 
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border shadow-sm transition-all hover:scale-110",
            isCollapsed ? "absolute -right-4 top-20 z-[100] bg-background" : ""
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
      
      {/* 2. MAIN NAVIGATION */}
      <div className="flex-1 overflow-y-auto overflow-x-visible py-6">
        {!isCollapsed && <div className="px-6 mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Main Menu</div>}
        <nav className="space-y-1.5 px-4 relative">
          {items.map(({ label, path, icon: Icon, count }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center rounded-xl transition-all duration-300",
                  isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-4 px-4 py-3",
                  isActive
                    ? "text-foreground bg-white dark:bg-[#151515] shadow-sm ring-1 ring-border/50 dark:ring-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand rounded-l-xl shadow-[0_0_12px_rgba(249,115,22,0.8)] z-10" />
                  )}
                  <Icon className={cn("flex-shrink-0 transition-all duration-300 group-hover:scale-110 relative z-10", isCollapsed ? "h-[22px] w-[22px]" : "h-5 w-5", isActive ? "text-brand" : "")} />
                  {!isCollapsed && (
                    <>
                      <span className="text-[14px] font-medium tracking-wide relative z-10">{label}</span>
                      {typeof count === 'number' && count > 0 && (
                        <span className={cn(
                          "ml-auto flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold relative z-10",
                          isActive ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"
                        )}>
                          {count}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-14 hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md group-hover:block z-[100] whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* 3. BOTTOM USER SECTION */}
      <div className="mt-auto px-4 pb-4 space-y-3 relative z-20">
        {/* Profile Card */}
        <div className={cn(
          "bg-white dark:bg-[#111111] border border-border shadow-sm rounded-xl flex items-center transition-all duration-200 group cursor-pointer hover:border-brand/30 hover:shadow-brand/5 hover:shadow-lg relative overflow-hidden",
          isCollapsed ? "p-2 justify-center" : "p-3 gap-3"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-brand/0 to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="h-10 w-10 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground font-bold flex-shrink-0 shadow-inner ring-1 ring-border relative z-10">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden relative z-10">
              <p className="text-[13px] font-bold text-foreground truncate group-hover:text-brand transition-colors">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          {!isCollapsed && (
            <div className="flex gap-1 relative z-10">
              <button onClick={() => authApi.logout().finally(logout)} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-14 hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md group-hover:block z-[100] whitespace-nowrap">
              {user?.name}
            </div>
          )}
        </div>

      </div>
      </motion.aside>
  )
}

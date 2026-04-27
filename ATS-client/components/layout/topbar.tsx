'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell, HelpCircle, Sun, Moon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/lib/store/auth-store'
import { useThemeStore } from '@/lib/store/theme-store'
import { MobileNav } from './mobile-nav'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/candidates': 'Candidates',
  '/roles': 'Roles',
  '/interviews': 'Interviews',
  '/settings': 'Settings',
  '/selected': 'Selected Candidates',
  '/interviewer': 'My Candidates',
  '/schedule': 'My Schedule',
}

export function TopBar() {
  const pathname = usePathname()
  const { user, company } = useAuthStore()
  const { mode, resolvedTheme, setMode } = useThemeStore()
  
  const toggleTheme = () => {
    if (mode === 'system') {
      setMode(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setMode(mode === 'dark' ? 'light' : 'dark')
    }
  }
  
  const title = pageTitles[pathname] || 'Dashboard'
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-4">
        <MobileNav />
        <h1 className="font-[Syne] text-lg font-semibold text-foreground">{title}</h1>
      </div>
      
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search candidates, roles..." 
            className="pl-9 bg-surface-2 border-border focus:ring-primary"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-surface-3 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 hover:bg-surface-2 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-surface border-border" align="end">
            <div className="space-y-2">
              <h3 className="font-medium">Notifications</h3>
              <div className="text-sm text-muted-foreground">
                No new notifications
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        <button className="p-2 hover:bg-surface-2 rounded-lg transition-colors hidden md:flex">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className="hidden md:block">
          <Avatar className="h-8 w-8">
            <AvatarFallback 
              className="text-brand-foreground text-xs"
              style={{ backgroundColor: company?.brand_color || 'hsl(var(--brand))' }}
            >
              {getInitials(user?.name || 'PS')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

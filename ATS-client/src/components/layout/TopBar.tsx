import { Bell, Moon, Plus, Search, Sun } from 'lucide-react'
import { Input } from '../ui/input'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../ui/button'

export function TopBar() {
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)

  return (
    <div className="sticky top-0 z-10 flex h-[68px] items-center justify-between px-8 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex-1"></div>
      
      <div className="flex items-center justify-center flex-1">
        <div className="relative w-full max-w-md group hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand transition-colors" />
          <Input 
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-brand focus:border-brand transition-all rounded-full h-9 text-sm" 
            placeholder="Search candidates, roles, interviews..." 
          />
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 flex-1">
        <Button variant="default" size="sm" className="bg-card hover:bg-muted text-foreground border border-border rounded-full font-medium gap-2 h-9 px-4">
          <Plus className="h-4 w-4" />
          <span>New Role</span>
        </Button>
        
        <div className="h-4 w-px bg-border mx-1"></div>
        
        <Button variant="ghost" size="icon" onClick={toggleMode} className="text-muted-foreground hover:text-foreground rounded-full hover:bg-card h-9 w-9">
          <Moon className="h-4 w-4 hidden dark:block" />
          <Sun className="h-4 w-4 block dark:hidden" />
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full hover:bg-card h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

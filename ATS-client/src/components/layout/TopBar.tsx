import { Moon, Search, Sun } from 'lucide-react'
import { Input } from '../ui/input'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../ui/button'

export function TopBar() {
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)

  return (
    <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-[var(--bg-page)] px-6">
      <div>
        <p className="text-sm font-semibold text-[var(--text-1)]">Talent Operations</p>
        <p className="text-xs text-[var(--text-2)]">Keep hiring flow moving</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={toggleMode}>
          {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {mode === 'light' ? 'Dark mode' : 'Light mode'}
        </Button>
        <div className="relative hidden w-[280px] md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <Input className="pl-9" placeholder="Search candidates, roles..." />
        </div>
      </div>
    </div>
  )
}

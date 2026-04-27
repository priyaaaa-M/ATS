'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users2, 
  Briefcase, 
  CalendarDays, 
  Settings2, 
  CheckCircle2,
  Search,
  Keyboard,
  Moon,
  Sun,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useCommandK, getShortcutsList } from '@/hooks/use-keyboard-shortcuts'
import { useThemeStore } from '@/lib/store/theme-store'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const router = useRouter()
  const { resolvedTheme, setMode } = useThemeStore()

  // Register Cmd+K to open
  useCommandK(() => setOpen(true))

  // Register ? to show shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts(true)
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const shortcuts = getShortcutsList()

  return (
    <CommandDialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setShowShortcuts(false)
    }}>
      <CommandInput placeholder={showShortcuts ? "Keyboard shortcuts..." : "Type a command or search..."} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {showShortcuts ? (
          <CommandGroup heading="Keyboard Shortcuts">
            {shortcuts.map((shortcut, i) => (
              <CommandItem key={i} disabled>
                <Keyboard className="mr-2 h-4 w-4" />
                <span>{shortcut.description}</span>
                <CommandShortcut>
                  {shortcut.keys.map((key, j) => (
                    <kbd key={j} className="ml-1 px-1.5 py-0.5 text-xs rounded bg-surface-3 border border-border">
                      {key}
                    </kbd>
                  ))}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
                <CommandShortcut>g d</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/candidates'))}>
                <Users2 className="mr-2 h-4 w-4" />
                <span>Candidates</span>
                <CommandShortcut>g c</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/roles'))}>
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Roles</span>
                <CommandShortcut>g r</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/interviews'))}>
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>Interviews</span>
                <CommandShortcut>g i</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>g s</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/selected'))}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>Selected Candidates</span>
                <CommandShortcut>g l</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand(() => {
                setMode(resolvedTheme === 'dark' ? 'light' : 'dark')
              })}>
                {resolvedTheme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>Toggle {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </CommandItem>
              <CommandItem onSelect={() => {
                setShowShortcuts(true)
              }}>
                <Keyboard className="mr-2 h-4 w-4" />
                <span>View Keyboard Shortcuts</span>
                <CommandShortcut>?</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

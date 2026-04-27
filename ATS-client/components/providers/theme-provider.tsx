'use client'

import { useEffect, useState } from 'react'
import { useThemeStore, type ThemeMode } from '@/lib/store/theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, setResolvedTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    const applyTheme = (theme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
      setResolvedTheme(theme)
    }

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }

      handleChange(mediaQuery)
      mediaQuery.addEventListener('change', handleChange)

      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      applyTheme(mode)
    }
  }, [mode, mounted, setResolvedTheme])

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    )
  }

  return <>{children}</>
}

// Theme toggle component for settings
export function ThemeToggle() {
  const { mode, setMode, resolvedTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'System',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Theme Mode</h3>
        <p className="text-sm text-muted-foreground">
          Choose how the application looks. Current: {resolvedTheme}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.value}
            onClick={() => setMode(theme.value)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
              ${mode === theme.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {theme.icon}
            <span className="text-sm font-medium">{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

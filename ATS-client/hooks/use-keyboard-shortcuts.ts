'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ShortcutHandler = () => void

interface Shortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: ShortcutHandler
  description: string
}

// Global shortcuts registry
const shortcuts: Shortcut[] = []

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur inputs
        if (e.key === 'Escape') {
          target.blur()
        }
        return
      }

      // Check registered shortcuts
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? (e.metaKey || e.ctrlKey) : true
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.handler()
          return
        }
      }

      // Built-in navigation shortcuts (g + key)
      if (e.key === 'g') {
        const handleNavigation = (nextKey: string) => {
          const routes: Record<string, string> = {
            'd': '/dashboard',
            'c': '/candidates',
            'r': '/roles',
            'i': '/interviews',
            's': '/settings',
            'l': '/selected',
          }
          
          const route = routes[nextKey.toLowerCase()]
          if (route) {
            router.push(route)
          }
        }

        const onNextKey = (nextEvent: KeyboardEvent) => {
          handleNavigation(nextEvent.key)
          window.removeEventListener('keydown', onNextKey)
        }

        window.addEventListener('keydown', onNextKey, { once: true })
        
        // Remove listener after 1 second if no key pressed
        setTimeout(() => {
          window.removeEventListener('keydown', onNextKey)
        }, 1000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}

export function registerShortcut(shortcut: Shortcut) {
  shortcuts.push(shortcut)
  return () => {
    const index = shortcuts.indexOf(shortcut)
    if (index > -1) {
      shortcuts.splice(index, 1)
    }
  }
}

// Hook for command palette / search
export function useCommandK(handler: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handler])
}

// Get all shortcuts for help dialog
export function getShortcutsList() {
  return [
    { keys: ['⌘', 'K'], description: 'Open search / command palette' },
    { keys: ['g', 'd'], description: 'Go to Dashboard' },
    { keys: ['g', 'c'], description: 'Go to Candidates' },
    { keys: ['g', 'r'], description: 'Go to Roles' },
    { keys: ['g', 'i'], description: 'Go to Interviews' },
    { keys: ['g', 's'], description: 'Go to Settings' },
    { keys: ['g', 'l'], description: 'Go to Selected' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modal / blur input' },
  ]
}

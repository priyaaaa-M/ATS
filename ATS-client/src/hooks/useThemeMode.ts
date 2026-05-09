import { useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'

export function useThemeMode() {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode])

  return mode
}

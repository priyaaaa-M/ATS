import { useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'

export function useThemeMode() {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  return mode
}

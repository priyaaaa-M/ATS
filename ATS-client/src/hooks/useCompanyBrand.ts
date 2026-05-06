import { useEffect } from 'react'
import { hexToHsl } from '../lib/utils'

export function useCompanyBrand() {
  useEffect(() => {
    const defaultBrand = '#EC5B24'
    document.documentElement.style.setProperty('--brand', defaultBrand)
    document.documentElement.style.setProperty('--primary', hexToHsl(defaultBrand))
  }, [])
}

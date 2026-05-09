import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { hexToHsl } from '../lib/utils'

export function useCompanyBrand() {
  const company = useAuthStore((state) => state.company)

  useEffect(() => {
    const brandColor = company?.brandColor || '#EC5B24'
    document.documentElement.style.setProperty('--brand', brandColor)
    document.documentElement.style.setProperty('--primary', hexToHsl(brandColor))
  }, [company?.brandColor])
}

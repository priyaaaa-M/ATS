import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | Date | null, dateFormat = 'MMM d, yyyy') {
  if (!value) return 'N/A'
  return format(new Date(value), dateFormat)
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return 'N/A'
  return format(new Date(value), 'MMM d, yyyy • h:mm a')
}

export function timeAgo(value?: string | Date | null) {
  if (!value) return 'just now'
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

export function hexToHsl(hex: string) {
  const sanitized = hex.replace('#', '')
  const normalized = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized
  const bigint = Number.parseInt(normalized, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function getInitials(value?: string | null) {
  if (!value) return 'AT'
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

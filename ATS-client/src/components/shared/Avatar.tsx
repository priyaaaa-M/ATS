import { getInitials, cn } from '../../lib/utils'

interface AvatarProps {
  name?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const sizeMap = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }
  return (
    <div className={cn('inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--brand)] font-semibold text-white', sizeMap[size], className)}>
      {imageUrl ? <img src={imageUrl} alt={name ?? 'Avatar'} className="h-full w-full object-cover" /> : getInitials(name)}
    </div>
  )
}

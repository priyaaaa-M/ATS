import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/candidates': 'Candidates',
  '/roles': 'Roles',
  '/interviews': 'Interviews',
  '/settings': 'Settings',
  '/interviewer': 'My Candidates',
}

export function TopBar() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = titles[pathname] ?? 'Settings'
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[#edf0f3] bg-white px-7 text-[#101828]">
      <p className="text-[14px] font-medium leading-none">{title}</p>
      <div className="flex items-center gap-[22px]">
        <Bell className="h-[15px] w-[15px] fill-[#f6c33a] text-[#f6c33a]" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EC5B24] text-[12px] font-semibold text-white">
          {initials}
        </div>
      </div>
    </div>
  )
}

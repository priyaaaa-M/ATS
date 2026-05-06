import { Briefcase, Calendar, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { authApi } from '../../api'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'
import { useLayoutStore } from '../../store/layoutStore'
import { Avatar } from '../shared/Avatar'

export function Sidebar({ candidateCount = 0, openRoles = 0 }: { candidateCount?: number; openRoles?: number }) {
  const { user, company } = useAuth()
  const logout = useAuthStore((state) => state.logout)
  const sidebarWidth = useLayoutStore((state) => state.sidebarWidth)

  const mainItems = user?.role === 'interviewer'
    ? [{ label: 'My Candidates', path: '/interviewer', icon: Users, count: candidateCount }]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Candidates', path: '/candidates', icon: Users, count: candidateCount },
        { label: 'Roles', path: '/roles', icon: Briefcase, count: openRoles },
        { label: 'Interviews', path: '/interviews', icon: Calendar },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]

  return (
    <aside style={{ width: sidebarWidth }} className="flex h-screen flex-col border-r border-[#edf0f3] bg-[#fbfcfd] px-5 py-6 text-[#667085]">
      <div className="mb-9 flex items-center gap-3">
        <Avatar name={company?.name} imageUrl={company?.logoUrl} size="md" className="h-10 w-10 text-[11px]" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#111827]">{company?.name ?? 'Company'}</p>
          <p className="text-[11px] text-[#98a2b3]">{user?.role?.replace('_', ' ') ?? ''}</p>
        </div>
      </div>

      <nav className="space-y-1">
        {mainItems.map(({ label, path, icon: Icon, count }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-[8px] px-3 text-[13px] transition ${
                isActive ? 'bg-[#f1f3f6] font-medium text-[#111827]' : 'hover:bg-[#f5f7f9] hover:text-[#344054]'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {typeof count === 'number' ? (
              <span className="ml-auto rounded-[5px] bg-[#eef4ff] px-2 py-0.5 text-[11px] font-medium text-[#246bfd]">{count}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#edf0f3] pt-5">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#111827]">{user?.name ?? user?.email ?? 'User'}</p>
            <p className="truncate text-[11px] capitalize text-[#98a2b3]">{user?.role?.replace('_', ' ') ?? ''}</p>
          </div>
          <button onClick={() => authApi.logout().finally(logout)} className="rounded-md p-2 text-[#98a2b3] transition hover:bg-[#f1f3f6] hover:text-[#344054]">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

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

  const items = user?.role === 'interviewer'
    ? [{ label: 'My Candidates', path: '/interviewer', icon: Users, count: candidateCount }]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Candidates', path: '/candidates', icon: Users, count: candidateCount },
        { label: 'Roles', path: '/roles', icon: Briefcase, count: openRoles },
        { label: 'Interviews', path: '/interviews', icon: Calendar },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]

  return (
    <aside style={{ width: sidebarWidth }} className="flex h-screen flex-col bg-[var(--bg-sidebar)] px-4 py-5 text-[var(--text-sb)] border-r border-[var(--border-sb)]">
      <div className="mb-8 flex items-center gap-3 px-2">
        <Avatar name={company?.name} imageUrl={company?.logoUrl} size="md" className="h-10 w-10 text-[11px]" />
        <div>
          <p className="text-[14px] font-semibold text-[var(--text-sb-act)]">{company?.name ?? 'ATS Company'}</p>
          <p className="text-[11px] text-[var(--text-sb)]">ATS Platform</p>
        </div>
      </div>
      <nav className="space-y-1.5">
        {items.map(({ label, path, icon: Icon, count }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex h-11 items-center gap-[10px] rounded-[12px] border-l-[3px] px-3.5 text-[15px] transition ${
                isActive
                  ? 'border-[var(--brand)] bg-[var(--bg-sidebar-act)] font-semibold text-[var(--text-sb-act)] shadow-[0_0_0_1px_rgba(255,255,255,0.01)]'
                  : 'border-transparent text-[var(--text-sb)] hover:bg-[var(--bg-sidebar-hover)]'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            {typeof count === 'number' ? (
              <span className="ml-auto rounded-full bg-[var(--brand)] px-[5px] py-[2px] text-[9px] text-white font-bold">{count}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-[var(--border-sb)] pt-4">
        <div className="flex items-center gap-3 rounded-[12px] bg-[var(--bg-sidebar-hover)] px-3 py-3 border border-[var(--border-sb)]">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[var(--text-sb-act)] font-semibold">{user?.name}</p>
            <p className="truncate text-[11px] text-[var(--text-sb)] capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={() => authApi.logout().finally(logout)}
            className="text-[var(--text-sb)] hover:text-[var(--text-sb-act)] transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

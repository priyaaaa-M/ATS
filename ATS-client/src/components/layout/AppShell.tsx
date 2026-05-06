import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCompanyBrand } from '../../hooks/useCompanyBrand'
import { useThemeMode } from '../../hooks/useThemeMode'
import { useCandidates } from '../../hooks/useCandidates'
import { useRoles } from '../../hooks/useRoles'
import { useLayoutStore } from '../../store/layoutStore'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  useCompanyBrand()
  useThemeMode()
  const { data: candidates = [] } = useCandidates({})
  const { data: roles = [] } = useRoles()
  const openRoles = roles.filter((role) => role.status === 'open').length
  const sidebarWidth = useLayoutStore((state) => state.sidebarWidth)
  const setSidebarWidth = useLayoutStore((state) => state.setSidebarWidth)
  const [resizing, setResizing] = useState(false)

  useEffect(() => {
    if (!resizing) return
    const onMove = (event: MouseEvent) => setSidebarWidth(event.clientX)
    const onUp = () => setResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, setSidebarWidth])

  return (
    <div className="flex min-h-screen">
      <Sidebar candidateCount={candidates.length} openRoles={openRoles} />
      <button
        type="button"
        aria-label="Resize sidebar"
        onMouseDown={() => setResizing(true)}
        style={{ left: sidebarWidth - 2 }}
        className="fixed top-0 z-40 hidden h-screen w-1 cursor-col-resize bg-transparent transition hover:bg-[var(--brand)] md:block"
      />
      <div className="min-w-0 flex-1">
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

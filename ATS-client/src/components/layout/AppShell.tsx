import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCompanyBrand } from '../../hooks/useCompanyBrand'
import { useThemeMode } from '../../hooks/useThemeMode'
import { useCandidates } from '../../hooks/useCandidates'
import { useRoles } from '../../hooks/useRoles'
import { useLayoutStore } from '../../store/layoutStore'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { motion, AnimatePresence } from 'framer-motion'

export function AppShell() {
  useCompanyBrand()
  useThemeMode()
  const location = useLocation()
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
    <div className="flex h-screen overflow-hidden">
      <aside className="h-screen flex-shrink-0 overflow-y-auto">
        <Sidebar candidateCount={candidates.length} openRoles={openRoles} />
      </aside>
      <button
        type="button"
        aria-label="Resize sidebar"
        onMouseDown={() => setResizing(true)}
        style={{ left: sidebarWidth - 2 }}
        className="fixed top-0 z-40 hidden h-screen w-1 cursor-col-resize bg-transparent transition hover:bg-[var(--brand)] md:block"
      />
      <div className="min-w-0 flex-1 h-screen overflow-y-auto">
        <TopBar />
        <main className="min-h-0 p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

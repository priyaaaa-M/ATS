import { Outlet, useLocation } from 'react-router-dom'
import { useCompanyBrand } from '../../hooks/useCompanyBrand'
import { useThemeMode } from '../../hooks/useThemeMode'
import { useCandidates } from '../../hooks/useCandidates'
import { useRoles } from '../../hooks/useRoles'
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

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="h-screen flex-shrink-0 relative z-20">
        <Sidebar candidateCount={candidates.length} openRoles={openRoles} />
      </aside>
      <div className="min-w-0 flex-1 h-screen flex flex-col overflow-hidden relative z-10">
        <TopBar />
        <main className="min-h-0 flex-1 p-8 pt-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

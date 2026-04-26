import type { Perfil } from '@/types/perfil'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  perfil: Perfil | null
  pageTitle?: string
  notifCount?: number
}

export default function AppShell({ children, perfil, pageTitle, notifCount = 0 }: AppShellProps) {
  const rol = perfil?.rol ?? 'carpintero'

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface)]">
      {/* Sidebar — solo desktop */}
      <Sidebar perfil={perfil} />

      {/* Columna principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={pageTitle} perfil={perfil} notifCount={notifCount} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 animate-fade-in">
          {children}
        </main>

        {/* BottomNav — solo mobile */}
        <BottomNav rol={rol} />
      </div>
    </div>
  )
}

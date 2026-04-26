'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/perfil'
import { NAV_ITEMS_BY_ROL } from './navItems'
import Avatar from '@/components/ui/Avatar'

interface SidebarProps {
  perfil: Perfil | null
}

export default function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const rol = perfil?.rol ?? 'carpintero'
  const items = NAV_ITEMS_BY_ROL[rol]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen bg-[var(--primary)] text-white overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <span className="font-black text-lg text-white">CJ</span>
        </div>
        <div>
          <p className="font-black text-white leading-tight">CJ Expertos</p>
          <p className="text-xs text-blue-200 capitalize">{rol}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(item => {
          const active = pathname === item.href
            || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                active
                  ? 'bg-[var(--primary-mid)] text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: user + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={perfil?.avatar_url} name={perfil?.nombre} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{perfil?.nombre ?? 'Usuario'}</p>
            <p className="text-xs text-blue-300 truncate">{perfil?.empresa ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-xs font-semibold text-blue-300 hover:text-red-300 hover:bg-white/10 py-2 px-3 rounded-lg transition-colors text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

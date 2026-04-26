'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Rol } from '@/types/perfil'
import { NAV_ITEMS_BY_ROL } from './navItems'

interface BottomNavProps {
  rol: Rol
}

export default function BottomNav({ rol }: BottomNavProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS_BY_ROL[rol].slice(0, 5)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const active = pathname === item.href
            || (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                active ? 'text-[var(--primary)]' : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
              <span className={['text-[10px] font-semibold leading-none', active ? 'text-[var(--primary)]' : ''].join(' ')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

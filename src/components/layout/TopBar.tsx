'use client'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import type { Perfil } from '@/types/perfil'
import Avatar from '@/components/ui/Avatar'
import PushRegistration from '@/components/PushRegistration'

interface TopBarProps {
  title?: string
  perfil: Perfil | null
  notifCount?: number
}

export default function TopBar({ title, perfil, notifCount = 0 }: TopBarProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
      <h1 className="text-lg font-bold text-slate-800 truncate">{title ?? 'CJ Expertos'}</h1>
      <div className="flex items-center gap-2">
        {/* Push toggle */}
        <PushRegistration />

        {/* Notificaciones */}
        <Link
          href="/notificaciones"
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Avatar src={perfil?.avatar_url} name={perfil?.nombre} size="sm" />
      </div>
    </header>
  )
}

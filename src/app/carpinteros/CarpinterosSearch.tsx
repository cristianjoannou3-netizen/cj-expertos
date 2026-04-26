'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import CarpinteroCard from '@/components/CarpinteroCard'
import type { Perfil } from '@/types/perfil'
import { Search } from 'lucide-react'

export default function CarpinterosSearch({ lista }: { lista: Perfil[] }) {
  const [q, setQ] = useState('')

  const filtrados = lista.filter(p => {
    if (!q) return true
    const lower = q.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(lower) ||
      (p.ciudad ?? '').toLowerCase().includes(lower) ||
      (p.provincia ?? '').toLowerCase().includes(lower)
    )
  })

  return (
    <>
      <div className="mb-5">
        <Input
          placeholder="Buscar por nombre o ciudad..."
          value={q}
          onChange={e => setQ(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold">Sin resultados para &quot;{q}&quot;</p>
          <p className="text-sm mt-1">Probá con otro nombre o ciudad.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(c => (
            <CarpinteroCard key={c.id} perfil={c} />
          ))}
        </div>
      )}
    </>
  )
}

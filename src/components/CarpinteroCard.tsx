import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import RangoBadge from '@/components/RangoBadge'
import type { Perfil } from '@/types/perfil'
import { MapPin, Briefcase, Clock, Star } from 'lucide-react'

interface CarpinteroCardProps {
  perfil: Perfil
  promedioCalif?: number | null
  cantResenas?: number
}

export default function CarpinteroCard({ perfil, promedioCalif, cantResenas }: CarpinteroCardProps) {
  return (
    <Link href={`/carpinteros/${perfil.id}`}>
      <Card hover className="h-full card-hover">
        <div className="flex items-start gap-3">
          <Avatar src={perfil.avatar_url} name={perfil.nombre} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{perfil.nombre}</h3>
            {perfil.ciudad && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {perfil.ciudad}
                {perfil.provincia ? `, ${perfil.provincia}` : ''}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <RangoBadge rango={perfil.rango} />
              {perfil.verificado && (
                <Badge variant="info" size="sm">Verificado</Badge>
              )}
            </div>
          </div>
        </div>

        {perfil.bio && (
          <p className="text-xs text-slate-500 mt-3 line-clamp-2">{perfil.bio}</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {perfil.experiencia != null && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {perfil.experiencia} años
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase size={11} /> {perfil.puntos} obras
            </span>
          </div>
          {promedioCalif != null && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <Star size={11} fill="currentColor" />
              {promedioCalif.toFixed(1)}
              {cantResenas ? <span className="text-slate-400 font-normal">({cantResenas})</span> : null}
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}

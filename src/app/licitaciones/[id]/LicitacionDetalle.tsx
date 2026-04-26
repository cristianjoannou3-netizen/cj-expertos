'use client'
import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DetalleCabecera from '@/components/licitaciones/DetalleCabecera'
import CotizacionesPanel from '@/components/licitaciones/CotizacionesPanel'
import ContratoDigital from '@/components/licitaciones/ContratoDigital'
import EtapasCertificacion from '@/components/licitaciones/EtapasCertificacion'
import CitaMedicion from '@/components/licitaciones/CitaMedicion'
import SolicitudMateriales from '@/components/licitaciones/SolicitudMateriales'
import AccionesEscrow from '@/components/licitaciones/AccionesEscrow'
import PagoEscrow from '@/components/licitaciones/PagoEscrow'
import ChatLicitacion from '@/components/licitaciones/ChatLicitacion'
import type { LicitacionDetalle as LicitacionDetalleType, Cotizacion, EtapaCertificacion, ContratoFirma, Cita, Pago } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: LicitacionDetalleType
  perfil: Perfil
  carpinterosMap: Record<string, Perfil>
  proveedores: Perfil[]
}

export default function LicitacionDetalle({ licitacion: initialLicitacion, perfil, carpinterosMap, proveedores }: Props) {
  const [licitacion, setLicitacion] = useState(initialLicitacion)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(initialLicitacion.cotizaciones)
  const [etapas, setEtapas] = useState<EtapaCertificacion[]>(initialLicitacion.etapas)
  const [contratos, setContratos] = useState<ContratoFirma[]>(initialLicitacion.contratos)
  const [citas, setCitas] = useState<Cita[]>(initialLicitacion.citas)
  const [pagos, setPagos] = useState<Pago[]>(initialLicitacion.pagos ?? [])
  const [carpinterosMapState, setCarpinterosMapState] = useState(carpinterosMap)

  const supabase = createClient()

  const refresh = useCallback(async () => {
    const [licRes, cotRes, etapasRes, contratosRes, citasRes, pagosRes] = await Promise.all([
      supabase.from('licitaciones').select('*').eq('id', licitacion.id).single(),
      supabase.from('cotizaciones').select('*').eq('licitacion_id', licitacion.id).order('created_at'),
      supabase.from('etapas_certificacion').select('*').eq('licitacion_id', licitacion.id).order('orden'),
      supabase.from('contrato_firma').select('*').eq('licitacion_id', licitacion.id),
      supabase.from('citas').select('*').eq('licitacion_id', licitacion.id).order('created_at'),
      supabase.from('pagos').select('*').eq('licitacion_id', licitacion.id).order('created_at'),
    ])

    if (licRes.data) {
      const newCots = (cotRes.data ?? []) as Cotizacion[]
      const carpinteroElegidoId =
        licRes.data.estado !== 'abierta' && newCots.length > 0
          ? newCots[0].carpintero_id
          : null

      setLicitacion({
        ...licRes.data,
        cotizaciones: newCots,
        etapas: (etapasRes.data ?? []) as EtapaCertificacion[],
        contratos: (contratosRes.data ?? []) as ContratoFirma[],
        citas: (citasRes.data ?? []) as Cita[],
        pagos: (pagosRes.data ?? []) as Pago[],
        carpintero_elegido_id: carpinteroElegidoId,
      })
      setCotizaciones(newCots)
      setEtapas((etapasRes.data ?? []) as EtapaCertificacion[])
      setContratos((contratosRes.data ?? []) as ContratoFirma[])
      setCitas((citasRes.data ?? []) as Cita[])
      setPagos((pagosRes.data ?? []) as Pago[])

      // Actualizar mapa de carpinteros si hay nuevas cotizaciones
      const newIds = newCots.map(c => c.carpintero_id).filter(id => !carpinterosMapState[id])
      if (newIds.length > 0) {
        const { data: newProfiles } = await supabase
          .from('perfiles')
          .select('*')
          .in('id', newIds)
        if (newProfiles) {
          const updated = { ...carpinterosMapState }
          for (const p of newProfiles) updated[p.id] = p as Perfil
          setCarpinterosMapState(updated)
        }
      }
    }
  }, [licitacion.id, supabase, carpinterosMapState])

  const carpinteroElegidoId = licitacion.carpintero_elegido_id
  const cotizacionAdjudicada = cotizaciones.find(c => c.carpintero_id === carpinteroElegidoId) ?? cotizaciones[0] ?? null

  const puedeVerContrato = ['adjudicada', 'en_curso', 'completada'].includes(licitacion.estado)
  const puedeVerEtapas = ['en_curso', 'completada'].includes(licitacion.estado)
  const puedeVerPagos = ['adjudicada', 'en_curso', 'completada'].includes(licitacion.estado)
  const isCarpinteroAdj = perfil.id === carpinteroElegidoId
  const isClienteOAdmin = perfil.id === licitacion.cliente_id || perfil.rol === 'admin'

  const participantesChat = useMemo(() => {
    const map: Record<string, Perfil> = { [perfil.id]: perfil }
    if (carpinteroElegidoId && carpinterosMapState[carpinteroElegidoId]) {
      map[carpinteroElegidoId] = carpinterosMapState[carpinteroElegidoId]
    }
    return map
  }, [perfil, carpinteroElegidoId, carpinterosMapState])

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        href="/licitaciones"
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft size={15} /> Volver a licitaciones
      </Link>

      <DetalleCabecera licitacion={licitacion} />

      <CotizacionesPanel
        licitacion={licitacion}
        cotizaciones={cotizaciones}
        perfil={perfil}
        carpinterosMap={carpinterosMapState}
        onRefresh={refresh}
      />

      {puedeVerContrato && (
        <ContratoDigital
          licitacion={licitacion}
          contratos={contratos}
          perfil={perfil}
          carpinteroElegidoId={carpinteroElegidoId}
          onRefresh={refresh}
        />
      )}

      {puedeVerPagos && isClienteOAdmin && (
        <PagoEscrow
          licitacion={licitacion}
          pagos={pagos}
          cotizacion={cotizacionAdjudicada}
          perfil={perfil}
          carpintero={carpinteroElegidoId ? (carpinterosMapState[carpinteroElegidoId] ?? null) : null}
          onRefresh={refresh}
        />
      )}

      {(perfil.id === licitacion.cliente_id) && ['adjudicada', 'en_curso'].includes(licitacion.estado) && (
        <AccionesEscrow
          licitacion={licitacion}
          etapas={etapas}
          perfil={perfil}
          onRefresh={refresh}
        />
      )}

      {puedeVerEtapas && (
        <EtapasCertificacion
          licitacion={licitacion}
          etapas={etapas}
          perfil={perfil}
          carpinteroElegidoId={carpinteroElegidoId}
          onRefresh={refresh}
        />
      )}

      {isCarpinteroAdj && (
        <CitaMedicion
          licitacion={licitacion}
          citas={citas}
          perfil={perfil}
          carpinteroElegidoId={carpinteroElegidoId}
          onRefresh={refresh}
        />
      )}

      {isCarpinteroAdj && (
        <SolicitudMateriales
          licitacion={licitacion}
          perfil={perfil}
          proveedores={proveedores}
          carpinteroElegidoId={carpinteroElegidoId}
        />
      )}

      {puedeVerContrato && (
        <ChatLicitacion
          licitacionId={licitacion.id}
          perfil={perfil}
          participantes={participantesChat}
        />
      )}
    </div>
  )
}

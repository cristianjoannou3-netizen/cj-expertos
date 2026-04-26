import { NextRequest, NextResponse } from 'next/server'
import {
  enviarEmailBienvenida,
  enviarEmailNuevaCotizacion,
  enviarEmailCarpinteroElegido,
  enviarEmailPagoConfirmado,
  enviarEmailEtapaAprobada,
} from '@/lib/email'

// Tipos de email soportados
type TipoEmail =
  | 'bienvenida'
  | 'nueva_cotizacion'
  | 'carpintero_elegido'
  | 'pago_confirmado'
  | 'etapa_aprobada'

export async function POST(req: NextRequest) {
  // Validar secret interno
  const secret = req.headers.get('x-internal-secret')
  const expected = process.env.INTERNAL_SECRET
  if (expected && secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { tipo: TipoEmail; datos: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { tipo, datos } = body

  try {
    switch (tipo) {
      case 'bienvenida': {
        const result = await enviarEmailBienvenida(
          datos.email as string,
          datos.nombre as string
        )
        return NextResponse.json(result)
      }
      case 'nueva_cotizacion': {
        const result = await enviarEmailNuevaCotizacion(
          datos.emailCliente as string,
          datos.nombreCliente as string,
          datos.licitacionTitulo as string,
          datos.licitacionId as string
        )
        return NextResponse.json(result)
      }
      case 'carpintero_elegido': {
        const result = await enviarEmailCarpinteroElegido(
          datos.emailCarpintero as string,
          datos.nombreCarpintero as string,
          datos.licitacionTitulo as string,
          datos.licitacionId as string
        )
        return NextResponse.json(result)
      }
      case 'pago_confirmado': {
        const result = await enviarEmailPagoConfirmado(
          datos.destinatarios as { email: string; nombre: string }[],
          datos.monto as number,
          datos.licitacionTitulo as string,
          datos.licitacionId as string
        )
        return NextResponse.json({ ok: true, results: result })
      }
      case 'etapa_aprobada': {
        const result = await enviarEmailEtapaAprobada(
          datos.emailCarpintero as string,
          datos.nombreCarpintero as string,
          datos.etapaNombre as string,
          datos.licitacionTitulo as string,
          datos.licitacionId as string
        )
        return NextResponse.json(result)
      }
      default:
        return NextResponse.json({ ok: false, error: 'Tipo desconocido' }, { status: 400 })
    }
  } catch (e) {
    console.error('[email/send]', e)
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { payment } from '@/lib/mercadopago'
import crypto from 'crypto'

function verifyMPSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // si no hay secret configurado, omitir verificación en dev

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  const urlParams = new URL(req.url).searchParams
  const dataId = urlParams.get('data.id') ?? ''

  if (!xSignature) return false

  const parts = xSignature.split(',')
  const signatureParts: Record<string, string> = {}
  for (const part of parts) {
    const [k, v] = part.trim().split('=')
    if (k && v) signatureParts[k] = v
  }

  const ts = signatureParts['ts'] ?? ''
  const v1 = signatureParts['v1'] ?? ''

  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  return hmac === v1
}

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
    const notification = JSON.parse(body) as {
      type?: string
      action?: string
      data?: { id?: string | number }
    }

    if (!verifyMPSignature(req, body)) {
      console.warn('[webhook-mp] Firma inválida')
      return NextResponse.json({ ok: false }, { status: 200 }) // siempre 200 para MP
    }

    // Solo procesar notificaciones de tipo 'payment'
    if (notification.type !== 'payment' || !notification.data?.id) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const paymentId = Number(notification.data.id)
    const paymentData = await payment.get({ id: paymentId })

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const externalRef = paymentData.external_reference ?? ''
    const parts = externalRef.split(':')
    if (parts.length < 2) {
      console.error('[webhook-mp] external_reference inválido:', externalRef)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const licitacion_id = parts[0]
    const tramo = parseInt(parts[1], 10)
    const monto = paymentData.transaction_amount ?? 0

    const supabase = await createClient()

    // Verificar que no se procese dos veces el mismo pago
    const { data: existing } = await supabase
      .from('pagos')
      .select('id')
      .eq('mp_payment_id', String(paymentId))
      .maybeSingle()

    if (existing) {
      // Pago ya procesado
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Obtener datos de la licitación para notificaciones
    const { data: licitacion } = await supabase
      .from('licitaciones')
      .select('cliente_id')
      .eq('id', licitacion_id)
      .single()

    // INSERT pago con estado 'retenido'
    // Los fondos están retenidos en MP — CJ Expertos debe autorizar la liberación
    // vía POST /api/pagos/liberar cuando corresponda (por etapas o finalización)
    await supabase.from('pagos').insert({
      licitacion_id,
      tramo,
      monto,
      metodo: 'mercadopago',
      mp_payment_id: String(paymentId),
      estado: 'retenido',
    })

    // Actualizar el registro previo 'pendiente' si existía (creado al generar la preference)
    await supabase
      .from('pagos')
      .update({ estado: 'retenido', mp_payment_id: String(paymentId) })
      .eq('licitacion_id', licitacion_id)
      .eq('tramo', tramo)
      .eq('estado', 'pendiente')
      .is('mp_payment_id', null)

    // Notificar al carpintero y al cliente que el pago fue recibido (retenido)
    if (licitacion) {
      const { data: cotizacion } = await supabase
        .from('cotizaciones')
        .select('carpintero_id')
        .eq('licitacion_id', licitacion_id)
        .eq('estado', 'aceptada')
        .maybeSingle()

      const tramoLabels: Record<number, string> = {
        1: 'anticipo (40%)',
        2: 'materiales (60%)',
        3: 'saldo final',
      }
      const label = tramoLabels[tramo] ?? `tramo ${tramo}`

      const notifs = []

      if (cotizacion?.carpintero_id) {
        notifs.push({
          usuario_id: cotizacion.carpintero_id,
          tipo: 'pago',
          titulo: 'Pago recibido — fondos retenidos',
          mensaje: `El cliente pagó $${monto.toLocaleString('es-AR')} (${label}). Los fondos están retenidos en Mercado Pago hasta que CJ Expertos autorice la liberación.`,
          link: `/licitaciones/${licitacion_id}`,
        })
      }

      notifs.push({
        usuario_id: licitacion.cliente_id,
        tipo: 'pago',
        titulo: 'Pago procesado correctamente',
        mensaje: `Tu pago de $${monto.toLocaleString('es-AR')} (${label}) fue recibido. Los fondos quedan retenidos hasta la aprobación de la etapa.`,
        link: `/licitaciones/${licitacion_id}`,
      })

      await supabase.from('notificaciones').insert(notifs)

      // Emails de pago confirmado (fire-and-forget, server-side)
      const destinatariosEmail: { email: string; nombre: string }[] = []
      if (cotizacion?.carpintero_id) {
        const { data: carpPerfil } = await supabase
          .from('perfiles').select('email,nombre').eq('id', cotizacion.carpintero_id).single()
        if (carpPerfil?.email) destinatariosEmail.push({ email: carpPerfil.email, nombre: carpPerfil.nombre })
      }
      const { data: clientePerfil } = await supabase
        .from('perfiles').select('email,nombre').eq('id', licitacion.cliente_id).single()
      if (clientePerfil?.email) destinatariosEmail.push({ email: clientePerfil.email, nombre: clientePerfil.nombre })

      if (destinatariosEmail.length > 0) {
        const { data: licData } = await supabase
          .from('licitaciones').select('titulo').eq('id', licitacion_id).single()
        fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'pago_confirmado',
            datos: {
              destinatarios: destinatariosEmail,
              monto,
              licitacionTitulo: licData?.titulo ?? licitacion_id,
              licitacionId: licitacion_id,
            },
          }),
        }).catch(() => null)
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[webhook-mp] Error:', err)
    // Siempre retornar 200 para que MP no reintente indefinidamente
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

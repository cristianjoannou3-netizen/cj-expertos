import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { preference } from '@/lib/mercadopago'

const TRAMO_LABELS: Record<number, string> = {
  1: 'Anticipo (40%)',
  2: 'Liberación materiales (60%)',
  3: 'Saldo final',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { licitacion_id, monto, monto_total, tramo } = body as {
      licitacion_id: string
      monto: number
      monto_total?: number
      tramo: 1 | 2 | 3
    }

    if (!licitacion_id || !monto || !tramo) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    // monto_total es el monto del tramo con recargo MP; si no se envía, se usa monto
    const montoMP = monto_total ?? monto

    // Verificar que el usuario es el cliente de la licitación o admin
    const { data: licitacion } = await supabase
      .from('licitaciones')
      .select('cliente_id, titulo')
      .eq('id', licitacion_id)
      .single()

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, nombre, email')
      .eq('id', user.id)
      .single()

    if (!licitacion || !perfil) {
      return NextResponse.json({ error: 'Licitación o perfil no encontrado' }, { status: 404 })
    }

    if (licitacion.cliente_id !== user.id && perfil.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado para esta licitación' }, { status: 403 })
    }

    // Obtener carpintero adjudicado y verificar que tiene cuenta MP conectada
    const { data: cotizacion } = await supabase
      .from('cotizaciones')
      .select('carpintero_id, monto')
      .eq('licitacion_id', licitacion_id)
      .eq('estado', 'aceptada')
      .single()

    if (!cotizacion) {
      return NextResponse.json({ error: 'No se encontró carpintero adjudicado para esta licitación' }, { status: 404 })
    }

    const { data: carpintero } = await supabase
      .from('perfiles')
      .select('mp_user_id, nombre')
      .eq('id', cotizacion.carpintero_id)
      .single()

    if (!carpintero?.mp_user_id) {
      return NextResponse.json({
        error: 'El carpintero debe conectar su cuenta de Mercado Pago antes de recibir pagos',
        carpintero_sin_mp: true,
      }, { status: 422 })
    }

    // La comisión del 5% se cobra COMPLETA en el PRIMER pago (tramo 1)
    // En tramos 2 y 3, marketplace_fee = 0 (ya se cobró)
    // La comisión base es sobre el monto TOTAL de la obra (cotizacion.monto)
    const montoTotalObra = cotizacion.monto
    const comisionTotal = Math.round(montoTotalObra * 0.05 * 100) / 100
    const marketplaceFee = tramo === 1 ? comisionTotal : 0

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const description = TRAMO_LABELS[tramo] ?? `Tramo ${tramo}`

    const result = await preference.create({
      body: {
        items: [
          {
            id: `${licitacion_id}-${tramo}`,
            title: `CJ Expertos — ${description}`,
            description: `Licitación: ${licitacion.titulo}`,
            quantity: 1,
            unit_price: montoMP,
            currency_id: 'ARS',
          },
        ],
        marketplace_fee: marketplaceFee,
        payer: {
          name: perfil.nombre,
          email: perfil.email ?? user.email ?? '',
        },
        external_reference: `${licitacion_id}:${tramo}`,
        back_urls: {
          success: `${baseUrl}/licitaciones/${licitacion_id}?payment_status=approved`,
          failure: `${baseUrl}/licitaciones/${licitacion_id}?payment_status=failure`,
          pending: `${baseUrl}/licitaciones/${licitacion_id}?payment_status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'CJ Expertos',
      },
    })

    // Registrar preferencia en BD con estado 'pendiente' hasta que el webhook confirme
    await supabase.from('pagos').insert({
      licitacion_id,
      tramo,
      monto,
      monto_mp: montoMP !== monto ? montoMP : null,
      metodo: 'mercadopago',
      estado: 'pendiente',
    })

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id,
    })
  } catch (err) {
    console.error('[crear-preferencia]', err)
    return NextResponse.json({ error: 'Error interno al crear preferencia' }, { status: 500 })
  }
}

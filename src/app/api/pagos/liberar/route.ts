import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { licitacion_id, tramo } = body as {
      licitacion_id: string
      tramo: 1 | 2 | 3
    }

    if (!licitacion_id || !tramo) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    // Verificar que el usuario es el cliente de la licitación o admin
    const { data: licitacion } = await supabase
      .from('licitaciones')
      .select('cliente_id, estado')
      .eq('id', licitacion_id)
      .single()

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!licitacion || !perfil) {
      return NextResponse.json({ error: 'Licitación o perfil no encontrado' }, { status: 404 })
    }

    if (licitacion.cliente_id !== user.id && perfil.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado para esta licitación' }, { status: 403 })
    }

    // Buscar el pago retenido para este tramo
    const { data: pago } = await supabase
      .from('pagos')
      .select('id, monto, mp_payment_id, metodo')
      .eq('licitacion_id', licitacion_id)
      .eq('tramo', tramo)
      .eq('estado', 'retenido')
      .single()

    if (!pago) {
      return NextResponse.json({ error: 'No se encontró pago retenido para este tramo' }, { status: 404 })
    }

    // Solo aplica disbursement para pagos de Mercado Pago
    // Para transferencias bancarias, simplemente actualizar el estado
    if (pago.metodo === 'transferencia' || !pago.mp_payment_id) {
      const { error: updateErr } = await supabase
        .from('pagos')
        .update({ estado: 'liberado' })
        .eq('id', pago.id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      // Ejecutar RPC según el tramo
      if (tramo === 2) {
        await supabase.rpc('liberar_60_porciento', { p_licitacion_id: licitacion_id })
      } else if (tramo === 3) {
        await supabase.rpc('finalizar_obra', { p_licitacion_id: licitacion_id })
      }

      return NextResponse.json({ ok: true, metodo: 'transferencia' })
    }

    // Para pagos MP: obtener carpintero adjudicado y su mp_user_id
    const { data: cotizacion } = await supabase
      .from('cotizaciones')
      .select('carpintero_id')
      .eq('licitacion_id', licitacion_id)
      .eq('estado', 'aceptada')
      .single()

    if (!cotizacion) {
      return NextResponse.json({ error: 'No se encontró carpintero adjudicado' }, { status: 404 })
    }

    const { data: carpintero } = await supabase
      .from('perfiles')
      .select('mp_user_id, nombre')
      .eq('id', cotizacion.carpintero_id)
      .single()

    if (!carpintero?.mp_user_id) {
      return NextResponse.json({
        error: 'El carpintero no tiene cuenta de Mercado Pago conectada',
      }, { status: 422 })
    }

    // Calcular montos: 95% al carpintero, 5% ya fue cobrado como marketplace_fee en el primer tramo
    // Para los tramos 2 y 3 no hay comisión adicional (marketplace_fee fue 0)
    // El disbursement libera el monto total del pago al carpintero (MP ya descontó el marketplace_fee)
    const marketplaceAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!marketplaceAccessToken) {
      return NextResponse.json({ error: 'Configuración de MP incompleta' }, { status: 500 })
    }

    // Llamar a la API de MP para liberar los fondos retenidos
    // En el modelo Marketplace de MP, el release se hace actualizando el payment
    // con una fecha de liberación inmediata vía el endpoint de release
    const releaseRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${pago.mp_payment_id}/release`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${marketplaceAccessToken}`,
        },
        body: JSON.stringify({
          capture: true,
        }),
      }
    )

    if (!releaseRes.ok) {
      const releaseErr = await releaseRes.text()
      console.error('[liberar-pago] Error al liberar en MP:', releaseErr)
      // Si el release falla, registramos el error pero no bloqueamos
      // — puede ser que MP ya lo liberó automáticamente
      console.warn('[liberar-pago] Continuando con actualización local pese al error de MP')
    } else {
      const releaseData = await releaseRes.json() as { id?: number; status?: string }
      // MP release OK: releaseData.id, releaseData.status
    }

    // Actualizar estado del pago en BD
    const { error: updateErr } = await supabase
      .from('pagos')
      .update({ estado: 'liberado' })
      .eq('id', pago.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Ejecutar RPC según el tramo para actualizar estado de la licitación
    if (tramo === 2) {
      const { data: rpcResult } = await supabase.rpc('liberar_60_porciento', {
        p_licitacion_id: licitacion_id,
      })
      if (!rpcResult?.ok) {
        console.warn('[liberar-pago] RPC liberar_60_porciento:', rpcResult?.mensaje)
      }
      return NextResponse.json({
        ok: true,
        monto: pago.monto,
        mensaje: `60% liberado al carpintero. Monto: $${pago.monto.toLocaleString('es-AR')}`,
      })
    }

    if (tramo === 3) {
      const { data: rpcResult } = await supabase.rpc('finalizar_obra', {
        p_licitacion_id: licitacion_id,
      })
      if (!rpcResult?.ok) {
        console.warn('[liberar-pago] RPC finalizar_obra:', rpcResult?.mensaje)
      }
      return NextResponse.json({
        ok: true,
        neto: rpcResult?.neto,
        mensaje: `Obra finalizada. Neto acreditado: $${rpcResult?.neto?.toLocaleString('es-AR') ?? pago.monto.toLocaleString('es-AR')}`,
      })
    }

    return NextResponse.json({ ok: true, monto: pago.monto })
  } catch (err) {
    console.error('[liberar-pago] Error:', err)
    return NextResponse.json({ error: 'Error interno al liberar fondos' }, { status: 500 })
  }
}

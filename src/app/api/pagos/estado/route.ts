import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { payment } from '@/lib/mercadopago'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mpPaymentId = searchParams.get('mp_payment_id')

  if (!mpPaymentId) {
    return NextResponse.json({ error: 'mp_payment_id requerido' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await payment.get({ id: Number(mpPaymentId) })

    return NextResponse.json({
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      external_reference: result.external_reference,
    })
  } catch (err) {
    console.error('[pagos/estado]', err)
    return NextResponse.json({ error: 'Error al consultar el pago' }, { status: 500 })
  }
}

import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@cjexpertos.com'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cjexpertos.com'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY no configurada')
  return new Resend(key)
}

const LOGO_HTML = `
  <div style="background:#2563EB;display:inline-flex;align-items:center;justify-content:center;
    width:48px;height:48px;border-radius:12px;margin-bottom:16px;">
    <span style="color:white;font-weight:900;font-size:20px;font-family:sans-serif;">CJ</span>
  </div>
`

function base(titulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#2563EB;padding:28px 40px;">
            ${LOGO_HTML}
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">${titulo}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;color:#1e293b;font-size:15px;line-height:1.6;">
            ${cuerpo}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} CJ Expertos · <a href="${BASE_URL}" style="color:#2563EB;text-decoration:none;">cjexpertos.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:12px 28px;
    background:#2563EB;color:#ffffff;text-decoration:none;border-radius:10px;
    font-weight:700;font-size:14px;">${label}</a>`
}

// ─────────────────────────────────────────────
// 1. Bienvenida
// ─────────────────────────────────────────────
export async function enviarEmailBienvenida(email: string, nombre: string) {
  try {
    const html = base(
      '¡Bienvenido a CJ Expertos!',
      `<p>Hola <strong>${nombre}</strong>,</p>
       <p>Tu cuenta fue creada exitosamente. Ya podés publicar licitaciones, cotizar obras y conectarte con los mejores carpinteros de aluminio de Argentina.</p>
       ${btn(`${BASE_URL}/dashboard`, 'Ir al dashboard')}
       <p style="margin-top:24px;font-size:13px;color:#64748b;">Si no creaste esta cuenta, podés ignorar este email.</p>`
    )
    const { error } = await getResend().emails.send({
      from: FROM, to: email,
      subject: '¡Bienvenido a CJ Expertos!',
      html,
    })
    return { ok: !error, error: error?.message }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─────────────────────────────────────────────
// 2. Nueva cotización recibida (al cliente)
// ─────────────────────────────────────────────
export async function enviarEmailNuevaCotizacion(
  emailCliente: string,
  nombreCliente: string,
  licitacionTitulo: string,
  licitacionId: string
) {
  try {
    const link = `${BASE_URL}/licitaciones/${licitacionId}`
    const html = base(
      'Nueva cotización recibida',
      `<p>Hola <strong>${nombreCliente}</strong>,</p>
       <p>Tu licitación <strong>"${licitacionTitulo}"</strong> recibió una nueva cotización.</p>
       <p>Revisá las propuestas y elegí al carpintero que mejor se ajuste a tu proyecto.</p>
       ${btn(link, 'Ver cotizaciones')}`
    )
    const { error } = await getResend().emails.send({
      from: FROM, to: emailCliente,
      subject: `Nueva cotización para "${licitacionTitulo}"`,
      html,
    })
    return { ok: !error, error: error?.message }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─────────────────────────────────────────────
// 3. Carpintero elegido (al carpintero)
// ─────────────────────────────────────────────
export async function enviarEmailCarpinteroElegido(
  emailCarpintero: string,
  nombreCarpintero: string,
  licitacionTitulo: string,
  licitacionId: string
) {
  try {
    const link = `${BASE_URL}/licitaciones/${licitacionId}`
    const html = base(
      '¡Fuiste elegido para la obra!',
      `<p>Hola <strong>${nombreCarpintero}</strong>,</p>
       <p>¡Felicitaciones! El cliente eligió tu cotización para la obra <strong>"${licitacionTitulo}"</strong>.</p>
       <p>Ingresá para revisar el contrato, coordinar la medición y arrancar con el proyecto.</p>
       ${btn(link, 'Ver licitación adjudicada')}`
    )
    const { error } = await getResend().emails.send({
      from: FROM, to: emailCarpintero,
      subject: `¡Te eligieron para "${licitacionTitulo}"!`,
      html,
    })
    return { ok: !error, error: error?.message }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─────────────────────────────────────────────
// 4. Pago confirmado (a ambos)
// ─────────────────────────────────────────────
export async function enviarEmailPagoConfirmado(
  destinatarios: { email: string; nombre: string }[],
  monto: number,
  licitacionTitulo: string,
  licitacionId: string
) {
  const link = `${BASE_URL}/licitaciones/${licitacionId}`
  const montoFmt = monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })

  const results = await Promise.all(
    destinatarios.map(async ({ email, nombre }) => {
      try {
        const html = base(
          'Pago confirmado',
          `<p>Hola <strong>${nombre}</strong>,</p>
           <p>Se confirmó un pago de <strong>$${montoFmt}</strong> para la obra <strong>"${licitacionTitulo}"</strong>.</p>
           ${btn(link, 'Ver detalle de la obra')}`
        )
        const { error } = await getResend().emails.send({
          from: FROM, to: email,
          subject: `Pago confirmado — "${licitacionTitulo}"`,
          html,
        })
        return { ok: !error, error: error?.message }
      } catch (e) {
        return { ok: false, error: String(e) }
      }
    })
  )
  return results
}

// ─────────────────────────────────────────────
// 5. Etapa aprobada (al carpintero)
// ─────────────────────────────────────────────
export async function enviarEmailEtapaAprobada(
  emailCarpintero: string,
  nombreCarpintero: string,
  etapaNombre: string,
  licitacionTitulo: string,
  licitacionId: string
) {
  try {
    const link = `${BASE_URL}/licitaciones/${licitacionId}`
    const html = base(
      'Etapa aprobada por el cliente',
      `<p>Hola <strong>${nombreCarpintero}</strong>,</p>
       <p>El cliente aprobó la etapa <strong>"${etapaNombre}"</strong> de la obra <strong>"${licitacionTitulo}"</strong>.</p>
       <p>¡Seguí así! Revisá el avance y coordiná los próximos pasos.</p>
       ${btn(link, 'Ver etapas de la obra')}`
    )
    const { error } = await getResend().emails.send({
      from: FROM, to: emailCarpintero,
      subject: `Etapa aprobada — "${licitacionTitulo}"`,
      html,
    })
    return { ok: !error, error: error?.message }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

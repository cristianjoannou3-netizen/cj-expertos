import { MercadoPagoConfig, Preference, Payment, OAuth } from 'mercadopago'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno')
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
})

export const preference = new Preference(mpClient)
export const payment = new Payment(mpClient)
export const oAuthClient = new OAuth(mpClient)

# Deploy en Vercel — CJ Expertos

Guia paso a paso para llevar CJ Expertos a produccion usando Vercel + Supabase.

> Antes de hacer deploy, asegurate de haber completado los pasos en [SETUP_SUPABASE.md](./SETUP_SUPABASE.md).

---

## 1. Subir el repositorio a GitHub

```bash
# En la carpeta cj-expertos-next/
git remote add origin https://github.com/TU_USUARIO/cj-expertos.git
git push -u origin main
```

---

## 2. Importar el proyecto en Vercel

1. Ir a [https://vercel.com/new](https://vercel.com/new)
2. Conectar tu cuenta de GitHub si no lo hiciste aun
3. Buscar el repositorio `cj-expertos` y hacer clic en **Import**
4. Vercel detectara automaticamente que es un proyecto Next.js
5. **Framework Preset**: Next.js (auto-detectado)
6. **Root Directory**: dejar en `.` (raiz del repo)
7. Antes de hacer clic en Deploy, configurar las variables de entorno (seccion siguiente)

---

## 3. Variables de entorno

En Vercel > proyecto > **Settings** > **Environment Variables**, agregar todas las siguientes:

### Supabase

| Variable | Descripcion | Donde obtenerla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave publica/anonima de Supabase | Project Settings > API > anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service_role (SOLO servidor) | Project Settings > API > service_role key |

### Mercado Pago

| Variable | Descripcion | Donde obtenerla |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acceso privado de MP | mercadopago.com/developers > Credenciales |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Clave publica de MP (frontend) | mercadopago.com/developers > Credenciales |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret para validar firmas de webhooks | Configurarlo al crear el webhook en MP |
| `MERCADOPAGO_APP_ID` | ID de la aplicacion MP (marketplace) | mercadopago.com/developers > Tu aplicacion |
| `MERCADOPAGO_CLIENT_SECRET` | Client secret de MP (OAuth connect) | mercadopago.com/developers > Tu aplicacion |

### Email (Resend)

| Variable | Descripcion | Donde obtenerla |
|---|---|---|
| `RESEND_API_KEY` | API key de Resend | resend.com/api-keys |
| `RESEND_FROM_EMAIL` | Email remitente verificado en Resend | Ej: `noreply@cjexpertos.com` |

### Push Notifications (VAPID)

| Variable | Descripcion | Como generarla |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave publica VAPID | Ver seccion 5 de este documento |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (solo servidor) | Ver seccion 5 de este documento |

### URL y seguridad

| Variable | Descripcion | Valor |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL base del sitio en produccion | `https://tu-dominio.vercel.app` o dominio custom |
| `INTERNAL_SECRET` | Secret para autenticar llamadas internas entre rutas API | String aleatorio largo (32+ chars) |

### Google Maps (opcional)

| Variable | Descripcion | Donde obtenerla |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | API key de Google Maps | console.cloud.google.com |

---

## 4. Deploy automatico

1. Con las variables configuradas, hacer clic en **Deploy**
2. Vercel compilara el proyecto (2-3 min la primera vez)
3. Al finalizar obtendras una URL tipo `https://cj-expertos-xxxx.vercel.app`
4. Cada `git push` a la rama `main` disparara un redeploy automatico

---

## 5. Generar claves VAPID para Push Notifications

Las claves VAPID son necesarias para enviar notificaciones push. Generarlas una sola vez y guardarlas de forma segura.

```bash
npx web-push generate-vapid-keys
```

**Ejemplo de salida** (estas son de ejemplo, generar las propias):

```
Public Key:
BCMa2KGqUxOe8MQ7L6r7EgLsfDN_VWXvSmbToKnTjF4MULrJt3z5YCGpVQzxfn2OU06Vk9SWbfhSC3GHMT49j3Q

Private Key:
tuJybABkN2TDIwV15o-k0EF3gi4qrXTItAW5G44IDyg
```

- La `Public Key` va en `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- La `Private Key` va en `VAPID_PRIVATE_KEY`

> Estas claves son de ejemplo. Generar las propias y NO reutilizar estas.

---

## 6. Configurar el Webhook de Mercado Pago

En el panel de MP, ir a **Tu aplicacion** > **Webhooks** y configurar:

- **URL de notificacion**: `https://tu-dominio.vercel.app/api/webhooks/mercadopago`
- **Eventos**: `payment`
- Copiar el secret generado por MP y pegarlo en `MERCADOPAGO_WEBHOOK_SECRET`

---

## 7. Configurar dominio custom (opcional)

1. Vercel > proyecto > **Settings** > **Domains**
2. Agregar tu dominio: ej. `cjexpertos.com`
3. En tu proveedor de DNS, agregar los registros que Vercel indica (generalmente un CNAME o A record)
4. Vercel provee SSL automatico via Let's Encrypt
5. Actualizar `NEXT_PUBLIC_APP_URL` con el dominio final
6. Actualizar **Site URL** y **Redirect URLs** en Supabase Authentication

---

## 8. Verificar el deploy

- [ ] La pagina de login carga correctamente
- [ ] El registro de usuario funciona (Supabase Auth)
- [ ] Las imagenes de Supabase Storage se muestran
- [ ] Los pagos con Mercado Pago funcionan en sandbox
- [ ] Los emails de Resend se envian
- [ ] Las notificaciones push funcionan en Chrome/Edge

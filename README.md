# CJ Expertos

Plataforma web PWA para conectar propietarios con carpinteros de aluminio en Argentina. Gestiona licitaciones, obras, pagos en escrow via Mercado Pago, notificaciones push en tiempo real y un marketplace con rankings de profesionales.

---

## Pantallas principales

| Pantalla | Descripcion |
|---|---|
| `/login` y `/register` | Autenticacion con email/password via Supabase Auth |
| `/dashboard` | Resumen de obras activas, licitaciones, propuestas y estado de pagos |
| `/licitaciones` | Listado de licitaciones publicadas; filtros por zona, presupuesto y estado |
| `/licitaciones/nueva` | Formulario para publicar una nueva licitacion (propietario) |
| `/licitaciones/[id]` | Detalle de licitacion: propuestas recibidas, chat, planos adjuntos |
| `/obras` | Listado de obras del usuario autenticado |
| `/obras/[id]` | Detalle de obra: etapas, fotos, pagos, historial de mensajes |
| `/carpinteros` | Marketplace publico de carpinteros con busqueda y filtros |
| `/carpinteros/[id]` | Perfil publico de un carpintero: portfolio, ranking, resenas |
| `/mapa` | Mapa interactivo con ubicacion de carpinteros disponibles |
| `/billetera` | Saldo del carpintero, historial de pagos y solicitudes de retiro |
| `/perfil` | Edicion de perfil, certificaciones, foto y configuracion |
| `/notificaciones` | Centro de notificaciones en tiempo real |
| `/admin` | Panel de administracion: usuarios, licitaciones, comisiones y configuracion |

---

## Stack tecnologico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4
- **Base de datos / Auth / Storage**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Realtime)
- **Pagos**: [Mercado Pago](https://www.mercadopago.com.ar/developers) (Checkout Pro, Marketplace OAuth, Escrow)
- **Email**: [Resend](https://resend.com/)
- **Push Notifications**: Web Push API con claves VAPID + [Serwist](https://serwist.pages.dev/) (PWA / Service Worker)
- **Mapas**: React Leaflet + OpenStreetMap / Google Maps API
- **Graficos**: Recharts
- **Iconos**: Lucide React
- **Deploy**: [Vercel](https://vercel.com/)

---

## Estructura del proyecto

```
cj-expertos-next/
├── public/
│   ├── icons/          # Iconos PWA (192x192, 512x512)
│   └── manifest.json   # Web App Manifest
├── src/
│   ├── app/
│   │   ├── (app)/      # Layout con sidebar/navbar autenticado
│   │   ├── admin/      # Panel de administracion
│   │   ├── api/        # Route handlers (pagos, push, email, webhooks)
│   │   ├── billetera/  # Modulo de pagos del carpintero
│   │   ├── carpinteros/# Marketplace de carpinteros
│   │   ├── dashboard/  # Dashboard principal
│   │   ├── licitaciones/ # Modulo de licitaciones
│   │   ├── mapa/       # Mapa de carpinteros
│   │   ├── obras/      # Gestion de obras
│   │   └── perfil/     # Perfil de usuario
│   ├── components/     # Componentes reutilizables
│   ├── hooks/          # React hooks (useUser, useChat, etc.)
│   ├── lib/
│   │   ├── supabase/   # Clientes Supabase (client, server, middleware)
│   │   ├── mercadopago.ts
│   │   ├── webpush.ts
│   │   └── email.ts
│   ├── types/          # Tipos TypeScript globales
│   ├── middleware.ts    # Middleware de autenticacion Next.js
│   └── sw.ts           # Service Worker (PWA + Push Notifications)
├── supabase_schema_v2.sql
├── supabase_rpc_escrow.sql
├── supabase_migration_mp.sql
├── supabase_migration_perfil.sql
├── supabase_migration_mp_marketplace.sql
├── supabase_seed.sql
├── SETUP_SUPABASE.md   # Instrucciones de setup de base de datos
├── DEPLOY.md           # Guia de deploy en Vercel
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Correr en desarrollo

### Prerequisitos

- Node.js >= 20
- Una cuenta en [Supabase](https://supabase.com) con el proyecto configurado (ver [SETUP_SUPABASE.md](./SETUP_SUPABASE.md))

### Instalacion

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/cj-expertos.git
cd cj-expertos-next

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# 4. Correr el servidor de desarrollo
npm run dev
```

La aplicacion estara disponible en [http://localhost:3000](http://localhost:3000).

---

## Como deployar

Ver la guia completa en [DEPLOY.md](./DEPLOY.md).

Resumen rapido:
1. Configurar Supabase: [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)
2. Subir el repo a GitHub
3. Importar en [Vercel](https://vercel.com/new)
4. Configurar las variables de entorno
5. Deploy automatico

---

## Variables de entorno necesarias

Ver `.env.example` para la lista completa y comentada. Resumen:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_APP_ID=
MERCADOPAGO_CLIENT_SECRET=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=
INTERNAL_SECRET=

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

---

## Licencia

Proyecto privado — todos los derechos reservados.

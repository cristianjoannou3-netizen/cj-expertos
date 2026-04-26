# Setup Supabase — CJ Expertos

Seguir estos pasos en orden para dejar la base de datos lista antes del primer deploy.

---

## 1. Crear el proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com) e iniciar sesión.
2. Clic en **New project**.
3. Elegir organización, nombre (`cj-expertos`), contraseña de base de datos (guardarla) y región (recomendado: `South America (São Paulo)`).
4. Esperar a que el proyecto se aprovisione (~2 min).

---

## 2. Ejecutar los scripts SQL en orden

Ir a **SQL Editor** (barra lateral izquierda) y ejecutar cada archivo en el siguiente orden:

### 2.1 Schema principal

```
supabase_schema_v2.sql
```

Crea todas las tablas base: `perfiles`, `obras`, `licitaciones`, `propuestas`, `chats`, `mensajes`, `etapas`, `notificaciones`, `push_subscriptions`, etc.

### 2.2 Funciones RPC de escrow

```
supabase_rpc_escrow.sql
```

Funciones PL/pgSQL para el flujo de pagos en custodia (escrow): `crear_escrow`, `liberar_escrow`, `cancelar_escrow`.

### 2.3 Migración Mercado Pago base

```
supabase_migration_mp.sql
```

Agrega columnas de pago MP a las tablas existentes: `mp_payment_id`, `mp_preference_id`, `estado_pago`, etc.

### 2.4 Migración de perfiles extendidos

```
supabase_migration_perfil.sql
```

Extiende la tabla `perfiles` con campos de certificación, rango, ubicación (lat/lng) y configuración de notificaciones.

### 2.5 Migración Marketplace MP

```
supabase_migration_mp_marketplace.sql
```

Agrega soporte para MP Connect (marketplace): `mp_access_token`, `mp_refresh_token`, `mp_user_id` en perfiles de carpinteros.

### 2.6 Seed de datos (opcional — solo para entorno de prueba)

```
supabase_seed.sql
```

Carga datos de ejemplo: usuarios de prueba, obras, licitaciones y propuestas. **No ejecutar en producción real.**

---

## 3. Configurar Storage — crear los buckets

Ir a **Storage** (barra lateral izquierda) > **New bucket** y crear los siguientes buckets. Todos deben ser **Public**:

| Bucket | Descripcion |
|---|---|
| `fotos-obra` | Fotos de progreso de obras |
| `fotos-etapas` | Fotos de etapas/hitos de obra |
| `planos-licitacion` | Planos y archivos adjuntos de licitaciones |
| `firmas` | Firmas digitales de contratos |
| `comprobantes` | Comprobantes de pago |
| `avatares` | Fotos de perfil de usuarios |

Para cada bucket:
1. Clic en **New bucket**
2. Ingresar el nombre exacto de la tabla anterior
3. Marcar **Public bucket** = activado
4. Clic en **Save**

---

## 4. Copiar las credenciales del proyecto

Ir a **Project Settings** > **API**:

- **Project URL**: `https://XXXXXXXXXXXXXXXX.supabase.co`  → valor para `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → valor para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (secreto) → valor para `SUPABASE_SERVICE_ROLE_KEY`

> La `service_role key` tiene acceso total sin restricciones de RLS. Nunca exponerla al cliente ni incluirla en el frontend.

---

## 5. Configurar Auth (opcional pero recomendado)

En **Authentication** > **URL Configuration**:

- **Site URL**: `https://tu-dominio.vercel.app` (o dominio custom)
- **Redirect URLs**: agregar `https://tu-dominio.vercel.app/**`

En **Authentication** > **Email Templates**: personalizar los correos de confirmación y recuperación de contraseña con el branding de CJ Expertos.

---

## 6. Verificar RLS (Row Level Security)

Todas las tablas ya tienen RLS habilitado por los scripts anteriores. Verificar en **Table Editor** > cada tabla > **RLS** que aparece como "enabled".

Si alguna tabla muestra RLS deshabilitado, ejecutar en SQL Editor:
```sql
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

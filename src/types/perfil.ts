export type Rol = 'carpintero' | 'cliente' | 'proveedor' | 'admin'

export interface Perfil {
  id: string
  nombre: string
  empresa?: string | null
  email?: string | null
  telefono?: string | null
  ciudad?: string | null
  provincia?: string | null
  rol: Rol
  rango: string
  puntos: number
  saldo_billetera: number
  avatar_url?: string | null
  bio?: string | null
  m2_taller?: number | null
  empleados?: number | null
  experiencia?: number | null
  verificado: boolean
  activo: boolean
  created_at: string
  updated_at: string
  especialidades?: string[] | null
  zonas_cobertura?: string[] | null
  // MP Marketplace Connect (carpinteros)
  mp_access_token?: string | null
  mp_refresh_token?: string | null
  mp_user_id?: string | null
  // Datos bancarios para transferencias directas
  cbu?: string | null
  alias_bancario?: string | null
}

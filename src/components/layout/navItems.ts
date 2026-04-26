import type { Rol } from '@/types/perfil'
import { Home, Building2, Wallet, User, Gavel, PlusCircle, FileText, Map, Inbox, LayoutDashboard, Users, CreditCard, Percent, Calculator, Settings } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

export const NAV_ITEMS_BY_ROL: Record<Rol, NavItem[]> = {
  carpintero: [
    { href: '/dashboard',    label: 'Inicio',       icon: Home },
    { href: '/licitaciones', label: 'Licitaciones', icon: Gavel },
    { href: '/obras',        label: 'Mis Obras',    icon: Building2 },
    { href: '/calculador',   label: 'Calculador',   icon: Calculator },
    { href: '/billetera',    label: 'Billetera',    icon: Wallet },
    { href: '/perfil',       label: 'Perfil',       icon: User },
  ],
  cliente: [
    { href: '/dashboard',          label: 'Inicio',          icon: Home },
    { href: '/licitaciones/nueva', label: 'Nueva Licitación', icon: PlusCircle },
    { href: '/licitaciones',       label: 'Mis Licitaciones', icon: FileText },
    { href: '/carpinteros',        label: 'Carpinteros',      icon: Users },
    { href: '/mapa',               label: 'Mapa',            icon: Map },
    { href: '/perfil',             label: 'Perfil',          icon: User },
  ],
  proveedor: [
    { href: '/dashboard',   label: 'Inicio',     icon: Home },
    { href: '/solicitudes', label: 'Solicitudes', icon: Inbox },
    { href: '/perfil',      label: 'Mi Perfil',  icon: User },
  ],
  admin: [
    { href: '/admin',                label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/admin/usuarios',       label: 'Usuarios',     icon: Users },
    { href: '/admin/licitaciones',   label: 'Licitaciones', icon: Gavel },
    { href: '/admin/pagos',          label: 'Pagos',        icon: CreditCard },
    { href: '/admin/comisiones',     label: 'Comisiones',   icon: Percent },
    { href: '/admin/configuracion',  label: 'Configuración', icon: Settings },
    { href: '/billetera/retiros',    label: 'Retiros',      icon: Wallet },
  ],
}

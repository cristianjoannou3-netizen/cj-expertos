import type { ReactElement } from 'react'

interface RangoIconProps {
  rango: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = { sm: 24, md: 40, lg: 64 }

function Estrella1({ size }: { size: number }) {
  const id = 'sg1'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}_bg`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
        <linearGradient id={`${id}_star`} x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <filter id={`${id}_glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}_bg)`} opacity="0.4" />
      <g filter={`url(#${id}_glow)`}>
        <path d="M32 10 L36.9 25.2 L53 25.2 L40.1 34.5 L45 49.8 L32 40.5 L19 49.8 L23.9 34.5 L11 25.2 L27.1 25.2 Z"
          fill={`url(#${id}_star)`} stroke="#F59E0B" strokeWidth="0.5" />
      </g>
      <path d="M32 14 L35.5 25.2 L47.5 25.2 L38 32.5 L41.5 43.8 L32 36.5 L22.5 43.8 L26 32.5 L16.5 25.2 L28.5 25.2 Z"
        fill="white" opacity="0.25" />
    </svg>
  )
}

function Estrella2({ size }: { size: number }) {
  const id = 'sg2'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_s1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`${id}_s2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <filter id={`${id}_glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}_glow)`}>
        <path d="M20 10 L23.4 20 L34 20 L25.8 26 L29.2 36 L20 30 L10.8 36 L14.2 26 L6 20 L16.6 20 Z"
          fill={`url(#${id}_s1)`} stroke="#F59E0B" strokeWidth="0.3" />
        <path d="M44 10 L47.4 20 L58 20 L49.8 26 L53.2 36 L44 30 L34.8 36 L38.2 26 L30 20 L40.6 20 Z"
          fill={`url(#${id}_s2)`} stroke="#B45309" strokeWidth="0.3" />
      </g>
      <path d="M20 13 L22.4 20 L30 20 L24 24.5 L26.4 32 L20 27.5 L13.6 32 L16 24.5 L10 20 L17.6 20 Z"
        fill="white" opacity="0.2" />
      <path d="M44 13 L46.4 20 L54 20 L48 24.5 L50.4 32 L44 27.5 L37.6 32 L40 24.5 L34 20 L41.6 20 Z"
        fill="white" opacity="0.2" />
      <circle cx="20" cy="52" r="4" fill="#FCD34D" opacity="0.8" />
      <circle cx="44" cy="52" r="4" fill="#FBBF24" opacity="0.8" />
    </svg>
  )
}

function Estrella3({ size }: { size: number }) {
  const id = 'sg3'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_sc`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${id}_ss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id={`${id}_glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_f`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}_glow)`} />
      <g filter={`url(#${id}_f)`}>
        <path d="M13 22 L15.6 30 L24 30 L17.2 35 L19.8 43 L13 38 L6.2 43 L8.8 35 L2 30 L10.4 30 Z"
          fill={`url(#${id}_ss)`} />
        <path d="M51 22 L53.6 30 L62 30 L55.2 35 L57.8 43 L51 38 L44.2 43 L46.8 35 L40 30 L48.4 30 Z"
          fill={`url(#${id}_ss)`} />
        <path d="M32 6 L36.5 19.5 L51 19.5 L39.5 28 L44 41.5 L32 33 L20 41.5 L24.5 28 L13 19.5 L27.5 19.5 Z"
          fill={`url(#${id}_sc)`} stroke="#F59E0B" strokeWidth="0.5" />
      </g>
      <path d="M32 10 L35.2 19.5 L45 19.5 L37.5 25.5 L40.2 35 L32 29 L23.8 35 L26.5 25.5 L19 19.5 L28.8 19.5 Z"
        fill="white" opacity="0.25" />
    </svg>
  )
}

function Estrella4({ size }: { size: number }) {
  const id = 'sg4'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_main`} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <radialGradient id={`${id}_halo`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_f`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}_halo)`} />
      <g filter={`url(#${id}_f)`}>
        <path d="M10 16 L12 22.5 L19 22.5 L13.5 26.5 L15.5 33 L10 29 L4.5 33 L6.5 26.5 L1 22.5 L8 22.5 Z"
          fill={`url(#${id}_main)`} />
        <path d="M54 16 L56 22.5 L63 22.5 L57.5 26.5 L59.5 33 L54 29 L48.5 33 L50.5 26.5 L45 22.5 L52 22.5 Z"
          fill={`url(#${id}_main)`} />
        <path d="M32 4 L36.9 18 L52 18 L40 27 L44.9 41 L32 32 L19.1 41 L24 27 L12 18 L27.1 18 Z"
          fill={`url(#${id}_main)`} stroke="#F59E0B" strokeWidth="0.5" />
        <path d="M10 42 L12 48.5 L19 48.5 L13.5 52.5 L15.5 59 L10 55 L4.5 59 L6.5 52.5 L1 48.5 L8 48.5 Z"
          fill={`url(#${id}_main)`} opacity="0.7" />
        <path d="M54 42 L56 48.5 L63 48.5 L57.5 52.5 L59.5 59 L54 55 L48.5 59 L50.5 52.5 L45 48.5 L52 48.5 Z"
          fill={`url(#${id}_main)`} opacity="0.7" />
      </g>
      <path d="M32 8 L35.5 18 L46 18 L38 24.5 L41.5 35 L32 28.5 L22.5 35 L26 24.5 L18 18 L28.5 18 Z"
        fill="white" opacity="0.25" />
    </svg>
  )
}

function Estrella5({ size }: { size: number }) {
  const id = 'sg5'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}_halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}_star`} x1="32" y1="4" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <filter id={`${id}_glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}_halo)`} />
      {/* Destellos radiales */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1="32" y1="32"
          x2={32 + Math.cos((deg * Math.PI) / 180) * 30}
          y2={32 + Math.sin((deg * Math.PI) / 180) * 30}
          stroke="#FDE68A" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      ))}
      <g filter={`url(#${id}_glow)`}>
        {/* 4 estrellas pequeñas en esquinas */}
        <path d="M9 8 L10.5 13 L16 13 L11.5 16.5 L13 21.5 L9 18 L5 21.5 L6.5 16.5 L2 13 L7.5 13 Z"
          fill="#FCD34D" opacity="0.85" />
        <path d="M55 8 L56.5 13 L62 13 L57.5 16.5 L59 21.5 L55 18 L51 21.5 L52.5 16.5 L48 13 L53.5 13 Z"
          fill="#FCD34D" opacity="0.85" />
        <path d="M9 50 L10.5 55 L16 55 L11.5 58.5 L13 63 L9 59.5 L5 63 L6.5 58.5 L2 55 L7.5 55 Z"
          fill="#FBBF24" opacity="0.75" />
        <path d="M55 50 L56.5 55 L62 55 L57.5 58.5 L59 63 L55 59.5 L51 63 L52.5 58.5 L48 55 L53.5 55 Z"
          fill="#FBBF24" opacity="0.75" />
        {/* Estrella central grande */}
        <path d="M32 4 L37.5 20.5 L55 20.5 L41.5 30.5 L47 47 L32 37 L17 47 L22.5 30.5 L9 20.5 L26.5 20.5 Z"
          fill={`url(#${id}_star)`} stroke="#F59E0B" strokeWidth="0.5" />
      </g>
      <path d="M32 8 L36.2 20.5 L49 20.5 L39 28 L43.2 40.5 L32 33 L20.8 40.5 L25 28 L15 20.5 L27.8 20.5 Z"
        fill="white" opacity="0.3" />
      {/* Destellos de punta */}
      <path d="M32 2 L33 6 L32 10 L31 6 Z" fill="white" opacity="0.9" />
      <path d="M62 32 L58 33 L54 32 L58 31 Z" fill="white" opacity="0.9" />
      <path d="M32 62 L33 58 L32 54 L31 58 Z" fill="white" opacity="0.9" />
      <path d="M2 32 L6 33 L10 32 L6 31 Z" fill="white" opacity="0.9" />
    </svg>
  )
}

function GemZafiro({ size }: { size: number }) {
  const id = 'gz'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_main`} x1="32" y1="8" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="30%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${id}_top`} x1="32" y1="8" x2="32" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
        <radialGradient id={`${id}_shine`} cx="40%" cy="30%" r="45%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.23  0 0 0 0 0.51  0 0 0 0 0.96  0 0 0 0.7 0" in="blur" result="colorBlur" />
          <feMerge><feMergeNode in="colorBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}_glow)`}>
        {/* Corona (tabla superior) */}
        <polygon points="20,8 32,4 44,8 50,20 32,18 14,20" fill={`url(#${id}_top)`} />
        {/* Cintura */}
        <polygon points="14,20 50,20 56,28 32,58 8,28" fill={`url(#${id}_main)`} />
        {/* Facetas laterales */}
        <polygon points="14,20 32,18 32,58 8,28" fill="#1E40AF" opacity="0.5" />
        <polygon points="50,20 32,18 32,58 56,28" fill="#3B82F6" opacity="0.4" />
      </g>
      {/* Brillo */}
      <ellipse cx="26" cy="28" rx="8" ry="5" fill={`url(#${id}_shine)`} transform="rotate(-30 26 28)" />
      <path d="M28 14 L30 22 L36 22 L31 26 L33 34 L28 30 L23 34 L25 26 L20 22 L26 22 Z"
        fill="white" opacity="0.15" />
      {/* Destello blanco en arista */}
      <line x1="32" y1="18" x2="32" y2="58" stroke="white" strokeWidth="0.5" opacity="0.3" />
      <line x1="14" y1="20" x2="50" y2="20" stroke="white" strokeWidth="0.8" opacity="0.4" />
    </svg>
  )
}

function GemRubi({ size }: { size: number }) {
  const id = 'gr'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_main`} x1="32" y1="8" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="35%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id={`${id}_top`} x1="32" y1="6" x2="32" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEE2E2" />
          <stop offset="100%" stopColor="#FCA5A5" />
        </linearGradient>
        <radialGradient id={`${id}_shine`} cx="38%" cy="28%" r="42%">
          <stop offset="0%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.27  0 0 0 0 0.27  0 0 0 0.7 0" in="blur" result="colorBlur" />
          <feMerge><feMergeNode in="colorBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}_glow)`}>
        {/* Corte brillante: corona octagonal */}
        <polygon points="22,6 42,6 52,16 52,30 32,58 12,30 12,16" fill={`url(#${id}_main)`} />
        <polygon points="22,6 42,6 52,16 32,14 12,16" fill={`url(#${id}_top)`} />
        {/* Facetas */}
        <polygon points="12,16 32,14 32,58" fill="#B91C1C" opacity="0.5" />
        <polygon points="52,16 32,14 32,58" fill="#EF4444" opacity="0.35" />
        <polygon points="12,16 12,30 32,58" fill="#7F1D1D" opacity="0.4" />
        <polygon points="52,16 52,30 32,58" fill="#DC2626" opacity="0.3" />
      </g>
      {/* Brillo diagonal */}
      <ellipse cx="25" cy="24" rx="9" ry="5.5" fill={`url(#${id}_shine)`} transform="rotate(-25 25 24)" />
      {/* Aristas */}
      <line x1="32" y1="14" x2="32" y2="58" stroke="white" strokeWidth="0.4" opacity="0.35" />
      <polyline points="22,6 32,14 42,6" stroke="white" strokeWidth="0.6" opacity="0.5" fill="none" />
    </svg>
  )
}

function GemEsmeralda({ size }: { size: number }) {
  const id = 'ge'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_main`} x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        <linearGradient id={`${id}_top`} x1="32" y1="6" x2="32" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D1FAE5" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
        <radialGradient id={`${id}_shine`} cx="35%" cy="30%" r="45%">
          <stop offset="0%" stopColor="white" stopOpacity="0.75" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.73  0 0 0 0 0.51  0 0 0 0.7 0" in="blur" result="colorBlur" />
          <feMerge><feMergeNode in="colorBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}_glow)`}>
        {/* Corte esmeralda rectangular escalonado */}
        <polygon points="20,6 44,6 52,14 52,50 44,58 20,58 12,50 12,14" fill={`url(#${id}_main)`} />
        {/* Mesa (tabla) */}
        <polygon points="22,10 42,10 48,16 48,48 42,54 22,54 16,48 16,16" fill={`url(#${id}_main)`} opacity="0.7" />
        {/* Corona */}
        <polygon points="20,6 44,6 48,16 16,16" fill={`url(#${id}_top)`} />
        {/* Faceta izquierda oscura */}
        <polygon points="12,14 16,16 16,48 12,50" fill="#047857" opacity="0.6" />
        {/* Faceta derecha clara */}
        <polygon points="52,14 48,16 48,48 52,50" fill="#34D399" opacity="0.4" />
        {/* Escalonado interior */}
        <rect x="24" y="18" width="16" height="28" rx="1" fill="none" stroke="#6EE7B7" strokeWidth="0.7" opacity="0.5" />
      </g>
      {/* Transparencia con líneas interiores */}
      <line x1="20" y1="6" x2="20" y2="58" stroke="#34D399" strokeWidth="0.4" opacity="0.3" />
      <line x1="44" y1="6" x2="44" y2="58" stroke="#34D399" strokeWidth="0.4" opacity="0.3" />
      {/* Brillo diagonal */}
      <ellipse cx="24" cy="26" rx="9" ry="6" fill={`url(#${id}_shine)`} transform="rotate(-20 24 26)" />
    </svg>
  )
}

function GemDiamante({ size }: { size: number }) {
  const id = 'gd'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}_main`} x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0F9FF" />
          <stop offset="25%" stopColor="#BAE6FD" />
          <stop offset="60%" stopColor="#7EC8E3" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id={`${id}_top`} x1="32" y1="6" x2="32" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient id={`${id}_left`} x1="12" y1="22" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
        <linearGradient id={`${id}_right`} x1="52" y1="22" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#7EC8E3" />
        </linearGradient>
        <radialGradient id={`${id}_shine`} cx="38%" cy="28%" r="40%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}_glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.49  0 0 0 0 0.78  0 0 0 0 0.89  0 0 0 0.8 0" in="blur" result="colorBlur" />
          <feMerge><feMergeNode in="colorBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}_glow)`}>
        {/* Corte brillante clásico: corona + pabellón */}
        {/* Corona (parte superior) */}
        <polygon points="20,8 44,8 54,22 32,20 10,22" fill={`url(#${id}_top)`} />
        {/* Pabellón izquierdo */}
        <polygon points="10,22 32,20 32,58" fill={`url(#${id}_left)`} />
        {/* Pabellón derecho */}
        <polygon points="54,22 32,20 32,58" fill={`url(#${id}_right)`} />
        {/* Facetas corona izquierda */}
        <polygon points="20,8 10,22 32,20" fill="#075985" opacity="0.5" />
        <polygon points="32,4 20,8 32,20" fill="#E0F2FE" opacity="0.7" />
        {/* Facetas corona derecha */}
        <polygon points="44,8 54,22 32,20" fill="#BAE6FD" opacity="0.5" />
        <polygon points="32,4 44,8 32,20" fill="white" opacity="0.6" />
      </g>
      {/* Brillo superior */}
      <ellipse cx="26" cy="22" rx="10" ry="6" fill={`url(#${id}_shine)`} transform="rotate(-30 26 22)" />
      {/* Destellos de 4 puntas */}
      <path d="M32 2 L33.5 8 L32 14 L30.5 8 Z" fill="white" opacity="0.95" />
      <path d="M62 32 L56 33.5 L50 32 L56 30.5 Z" fill="white" opacity="0.95" />
      <path d="M32 62 L30.5 56 L32 50 L33.5 56 Z" fill="white" opacity="0.9" />
      <path d="M2 32 L8 30.5 L14 32 L8 33.5 Z" fill="white" opacity="0.9" />
      {/* Destellos de 45° pequeños */}
      <path d="M54 10 L51 14 L48 10 L51 6 Z" fill="white" opacity="0.7" />
      <path d="M10 10 L13 14 L16 10 L13 6 Z" fill="white" opacity="0.6" />
      <path d="M54 54 L51 50 L48 54 L51 58 Z" fill="white" opacity="0.6" />
      <path d="M10 54 L13 50 L16 54 L13 58 Z" fill="white" opacity="0.6" />
      {/* Aristas internas */}
      <line x1="32" y1="20" x2="32" y2="58" stroke="white" strokeWidth="0.5" opacity="0.4" />
      <line x1="10" y1="22" x2="54" y2="22" stroke="white" strokeWidth="0.7" opacity="0.35" />
    </svg>
  )
}

const RANGO_COMPONENTS: Record<string, (props: { size: number }) => ReactElement> = {
  estrella_1: Estrella1,
  estrella_2: Estrella2,
  estrella_3: Estrella3,
  estrella_4: Estrella4,
  estrella_5: Estrella5,
  zafiro:     GemZafiro,
  rubi:       GemRubi,
  esmeralda:  GemEsmeralda,
  diamante:   GemDiamante,
}

export default function RangoIcon({ rango, size = 'md' }: RangoIconProps) {
  const px = SIZE_MAP[size]
  const Component = RANGO_COMPONENTS[rango] ?? RANGO_COMPONENTS['estrella_1']
  return <Component size={px} />
}

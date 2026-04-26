import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  rounded?: 'full' | '2xl'
}

const sizeMap = {
  sm: { container: 'w-8 h-8 text-xs', img: 32 },
  md: { container: 'w-10 h-10 text-sm', img: 40 },
  lg: { container: 'w-14 h-14 text-lg', img: 56 },
  xl: { container: 'w-20 h-20 text-xl', img: 80 },
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Avatar({ src, name, size = 'md', className = '', rounded = 'full' }: AvatarProps) {
  const { container, img } = sizeMap[size]
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-2xl'

  return (
    <span
      className={[
        'inline-flex items-center justify-center overflow-hidden flex-shrink-0',
        'bg-[var(--primary)] text-white font-bold select-none',
        roundedClass,
        container,
        className,
      ].join(' ')}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'Avatar'}
          width={img}
          height={img}
          className="object-cover w-full h-full"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}

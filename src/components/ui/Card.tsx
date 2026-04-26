interface CardProps {
  children: React.ReactNode
  header?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  className?: string
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export default function Card({
  children,
  header,
  padding = 'md',
  hover = false,
  className = '',
}: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--card)] border border-slate-200 rounded-2xl shadow-sm',
        hover ? 'transition-shadow duration-200 hover:shadow-md' : '',
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-700">
          {header}
        </div>
      )}
      <div className={paddingMap[padding]}>{children}</div>
    </div>
  )
}

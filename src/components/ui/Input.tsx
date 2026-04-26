import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, className = '', id, ...rest },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-xl border bg-slate-50 text-slate-800 placeholder:text-slate-400',
            'px-4 py-3 text-sm transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : 'border-slate-200',
            icon ? 'pl-10' : '',
            className,
          ].join(' ')}
          {...rest}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
      )}
    </div>
  )
})

export default Input

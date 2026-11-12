import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'success' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_rgba(29,78,216,0.32)] hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(29,78,216,0.42)]',
  soft: 'border border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'border border-line-strong bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700',
  success: 'bg-ok text-white shadow-[0_6px_16px_rgba(15,157,107,0.28)] hover:brightness-110',
  danger: 'bg-bad-bg text-bad hover:bg-bad hover:text-white',
}
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8.5 gap-1.5 rounded-[9px] px-3 text-[13px]',
  md: 'h-10.5 gap-2 rounded-[11px] px-4.5 text-[14px]',
  icon: 'h-9.5 w-9.5 rounded-[10px]',
}

export function Button({ variant = 'primary', size = 'md', icon, loading, className, children, type = 'button', disabled, ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition duration-200 active:translate-y-px active:scale-[0.985] disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant], SIZES[size], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

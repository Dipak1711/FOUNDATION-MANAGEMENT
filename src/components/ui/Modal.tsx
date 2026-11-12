import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/i18n'
import { Button } from './Button'

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Slide in from the right (bottom sheet on phones). */
  drawer?: boolean
}

const WIDTH = { sm: 'max-w-110', md: 'max-w-160', lg: 'max-w-180' }

export function Modal({ title, subtitle, onClose, children, footer, size = 'lg', drawer }: Props) {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab' && box.current) {
        const f = box.current.querySelectorAll<HTMLElement>('button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const focusTimer = setTimeout(() => box.current?.querySelector<HTMLElement>('input,select,textarea')?.focus(), 60)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prev?.focus?.()
    }
  }, [])

  return createPortal(
    <div
      className={cn('fixed inset-0 z-100 grid animate-fade bg-brand-950/55 backdrop-blur-[5px]', drawer ? 'items-end justify-items-end sm:items-stretch' : 'place-items-end sm:place-items-center sm:p-5')}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'flex max-h-[94vh] w-full flex-col overflow-hidden bg-white shadow-float',
          drawer
            ? 'animate-drawer max-w-full rounded-t-3xl sm:h-full sm:max-h-none sm:max-w-115 sm:rounded-l-3xl sm:rounded-tr-none'
            : cn('animate-modal rounded-t-3xl sm:max-h-[calc(100vh-40px)] sm:rounded-3xl', WIDTH[size]),
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line bg-linear-to-b from-white to-brand-50 px-5 py-4.5 sm:px-6.5">
          <div className="min-w-0">
            <h3 className="truncate text-[18px] font-extrabold tracking-tight">{title}</h3>
            {subtitle && <p className="truncate text-[13px] text-ink-500">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('close')}><X size={18} /></Button>
        </div>
        <div className="overflow-y-auto px-5 py-5.5 sm:px-6.5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 border-t border-line bg-[#fbfcff] px-5 py-4 sm:px-6.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

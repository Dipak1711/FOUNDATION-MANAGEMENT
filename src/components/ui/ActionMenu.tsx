import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/i18n'

export interface MenuItem {
  label: string
  icon: ReactNode
  onClick: () => void
  tone?: 'default' | 'success' | 'danger'
  /** Hide the item without removing it from the config. */
  hidden?: boolean
}

const TONE = {
  default: 'text-ink-700 hover:bg-brand-50 hover:text-brand-700 focus:bg-brand-50',
  success: 'text-ok hover:bg-ok-bg focus:bg-ok-bg',
  danger: 'text-bad hover:bg-bad-bg focus:bg-bad-bg',
}

/** Three-dot row menu. Portal-rendered so it is never clipped by scrolling tables. */
export function ActionMenu({ items, label }: { items: MenuItem[]; label?: string }) {
  const { t } = useLang()
  const btn = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number; up: boolean } | null>(null)
  const visible = items.filter((i) => !i.hidden)

  const close = useCallback(() => setPos(null), [])

  const toggle = () => {
    if (pos) return close()
    const r = btn.current!.getBoundingClientRect()
    const up = window.innerHeight - r.bottom < visible.length * 44 + 24
    setPos({ top: up ? r.top - 6 : r.bottom + 6, right: window.innerWidth - r.right, up })
  }

  useLayoutEffect(() => { if (pos) menu.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus() }, [pos])

  useEffect(() => {
    if (!pos) return
    const down = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close() }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); btn.current?.focus() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const els = [...menu.current!.querySelectorAll<HTMLElement>('[role=menuitem]')]
        const i = els.indexOf(document.activeElement as HTMLElement)
        els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus()
      }
    }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key)
      window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close)
    }
  }, [pos, close])

  if (!visible.length) return null
  const firstDanger = visible.findIndex((i) => i.tone === 'danger')

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={!!pos} aria-label={label ?? t('actions')} title={label ?? t('actions')}
        className={cn('grid h-8.5 w-8.5 place-items-center rounded-[10px] border transition',
          pos ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-line-strong bg-white text-ink-500 hover:border-brand-400 hover:text-brand-700')}>
        <MoreVertical size={17} />
      </button>
      {pos && createPortal(
        <div ref={menu} role="menu"
          style={{ position: 'fixed', right: pos.right, [pos.up ? 'bottom' : 'top']: pos.up ? window.innerHeight - pos.top : pos.top }}
          className="z-90 min-w-52 animate-pop rounded-2xl border border-line bg-white p-1.5 shadow-float">
          {visible.map((it, i) => (
            <div key={it.label}>
              {i === firstDanger && i > 0 && <div className="mx-2 my-1 h-px bg-line" />}
              <button role="menuitem" type="button" onClick={() => { close(); it.onClick() }}
                className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.25 text-left text-[13.5px] font-semibold outline-none transition', TONE[it.tone ?? 'default'])}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-current/10">{it.icon}</span>
                {it.label}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

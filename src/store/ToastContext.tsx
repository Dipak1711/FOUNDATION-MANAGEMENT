import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, Check } from 'lucide-react'

interface ToastItem { id: number; msg: string; kind: 'ok' | 'error' }
interface ToastCtx { toast: (msg: string, kind?: 'ok' | 'error') => void }
const Ctx = createContext<ToastCtx | null>(null)
let uid = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const toast = useCallback<ToastCtx['toast']>((msg, kind = 'ok') => {
    const id = ++uid
    setItems((s) => [...s, { id, msg, kind }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3400)
  }, [])
  const value = useMemo(() => ({ toast }), [toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed inset-x-3.5 bottom-3.5 z-200 grid gap-2.5 sm:inset-x-auto sm:right-5 sm:bottom-5" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} role="status" className="flex min-w-72 max-w-sm animate-toast items-center gap-3 rounded-2xl bg-brand-950 px-4 py-3.5 text-[13.5px] font-semibold text-white shadow-float">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${t.kind === 'error' ? 'bg-bad' : 'bg-ok'}`}>
              {t.kind === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be used inside ToastProvider')
  return c.toast
}

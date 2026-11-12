import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { CollectionName } from '@/types'
import { MODULE_BY_COLL } from '@/config/modules'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { useLang } from '@/lib/i18n'

const NAME_KEYS = ['brideName', 'applicantName', 'policyHolder', 'sisterName', 'beneficiaryName', 'balikaName', 'holderName', 'name', 'clusterArea']
const EXTRA_ROUTES: Partial<Record<CollectionName, { to: string; title: [string, string] }>> = {
  agents: { to: '/agent-reg', title: ['Agent', 'एजेंट'] },
  payouts: { to: '/agent-pay', title: ['Commission payout', 'कमिशन भुगतान'] },
}

export function GlobalSearch() {
  const { t, L } = useLang()
  const { data } = useData()
  const { isAdmin, user } = useAuth()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus() } }
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', down); document.addEventListener('mousedown', click)
    return () => { document.removeEventListener('keydown', down); document.removeEventListener('mousedown', click) }
  }, [])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (needle.length < 2) return []
    const out: Array<{ key: string; label: string; sub: string; to: string; Icon?: React.ElementType }> = []
    for (const [coll, rows] of Object.entries(data) as Array<[CollectionName, Array<Record<string, unknown>>]>) {
      const mod = MODULE_BY_COLL[coll]
      const extra = EXTRA_ROUTES[coll]
      if (!mod && !extra) continue
      if (!isAdmin && !mod?.agentLinked) continue
      for (const r of rows) {
        if (!isAdmin && r.agentId !== user?.id) continue
        const { hash: _h, ...safe } = r
        if (!JSON.stringify(Object.values(safe)).toLowerCase().includes(needle)) continue
        const nameKey = NAME_KEYS.find((k) => r[k])
        out.push({ key: coll + r.id, label: String(nameKey ? r[nameKey] : r.id), sub: `${r.id} · ${mod ? L(mod.title) : L(extra!.title)}`, to: mod ? '/' + mod.id : extra!.to, Icon: mod?.icon })
        if (out.length >= 8) return out
      }
    }
    return out
  }, [q, data, isAdmin, user, L])

  const go = (to: string) => { nav(to); setOpen(false); setQ('') }

  return (
    <div ref={box} className="relative w-full max-w-140 flex-1">
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        ref={input} value={q} placeholder={t('searchPh')} aria-label={t('searchPh')} role="combobox" aria-expanded={open && q.length > 1} aria-controls="gs-list"
        className="control h-11 border-line pl-11 shadow-sm"
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter' && results[active]) go(results[active].to)
          else if (e.key === 'Escape') { setOpen(false); input.current?.blur() }
        }}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line-strong bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink-400 lg:block">⌘K</kbd>
      {open && q.trim().length >= 2 && (
        <div id="gs-list" role="listbox" className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 animate-pop overflow-auto rounded-2xl border border-line bg-white p-2 shadow-float">
          {results.length === 0 ? <div className="p-4.5 text-center text-ink-500">{t('noResults')}</div> : results.map((r, i) => (
            <button key={r.key} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(r.to)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-brand-50' : ''}`}>
              <span className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-[10px] bg-brand-50 text-brand-600">{r.Icon ? <r.Icon size={17} /> : <Search size={17} />}</span>
              <span className="min-w-0"><b className="block truncate text-[13.5px]">{r.label}</b><small className="block truncate text-ink-500">{r.sub}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

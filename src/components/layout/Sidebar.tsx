import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Heart, X } from 'lucide-react'
import type { Agent } from '@/types'
import { AGENT_ROUTES, NAV } from '@/config/nav'
import { MODULES, type Row } from '@/config/modules'
import { useAuth } from '@/store/AuthContext'
import { useData } from '@/store/DataContext'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-linear-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-[0_10px_24px_-8px_rgba(29,78,216,0.65)] ring-1 ring-inset ring-white/40', className)}>
      <Heart size={22} fill="currentColor" strokeWidth={1.5} />
    </div>
  )
}

export function Sidebar({ open, mini, onClose }: { open: boolean; mini: boolean; onClose: () => void }) {
  const { isAdmin, user } = useAuth()
  const { rows } = useData()
  const { t, L } = useLang()
  const { pathname } = useLocation()

  const groups = useMemo(
    () => NAV.map((g) => ({ ...g, items: g.items.filter((i) => isAdmin || AGENT_ROUTES.has(i.to)) })).filter((g) => g.items.length),
    [isAdmin],
  )
  const activeGroup = groups.find((g) => g.items.some((i) => i.to === pathname))?.id
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => ({ main: true, [activeGroup ?? 'schemes']: true }))
  // Navigating (e.g. from the search box) always reveals the destination's group.
  useEffect(() => { if (activeGroup) setOpenMap((m) => (m[activeGroup] ? m : { ...m, [activeGroup]: true })) }, [activeGroup])

  /** Pending-review counts shown as badges next to the items that need action. */
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const m of MODULES) {
      if (!m.flow) continue
      c['/' + m.id] = rows<Row>(m.coll).filter((r) => r.status === 'Pending' && (isAdmin || r.agentId === user?.id)).length
    }
    c['/agent-perm'] = rows<Agent>('agents').filter((a) => a.status === 'Pending').length
    return c
  }, [rows, isAdmin, user])

  return (
    <>
      <div onClick={onClose} aria-hidden className={cn('fixed inset-0 z-30 bg-brand-950/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')} />
      <aside
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[284px] flex-col border-r border-line bg-linear-to-b from-white to-brand-50',
          'transition-[transform,width] duration-250 ease-out-expo lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:self-start',
          open ? 'translate-x-0 shadow-float' : '-translate-x-full',
          mini && 'lg:w-21',
        )}
      >
        <div className={cn('flex items-center gap-3.5 px-5 py-5', mini && 'lg:justify-center lg:px-0')}>
          <BrandMark />
          <div className={cn('min-w-0 flex-1', mini && 'lg:hidden')}>
            <p className="truncate text-[17px] font-extrabold leading-tight tracking-tight text-ink-900">Foundation</p>
            <p className="mt-0.5 truncate text-[10.5px] font-semibold uppercase tracking-[0.2em] text-brand-600">Management</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-1.5 text-ink-500 transition hover:bg-brand-50 hover:text-ink-900 lg:hidden"><X size={20} /></button>
        </div>

        <nav className={cn('scroll-thin-dark flex-1 overflow-y-auto px-3 pb-4', mini && 'lg:px-2.5')}>
          {groups.map((g) => {
            const closed = !openMap[g.id]
            const badge = g.items.reduce((s, i) => s + (counts[i.to] ?? 0), 0)
            return (
              <div key={g.id} className="mb-1.5">
                <button
                  type="button" aria-expanded={!closed}
                  onClick={() => setOpenMap((m) => ({ ...m, [g.id]: !m[g.id] }))}
                  className={cn('flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-brand-50 active:scale-[0.99]', mini && 'lg:hidden')}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand-50 text-ink-700 ring-1 ring-inset ring-line"><g.icon size={18} /></span>
                  <span className="flex-1 truncate text-[14.5px] font-semibold text-ink-900">{t(g.key)}</span>
                  {closed && badge > 0 && <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-brand-700">{badge}</span>}
                  <ChevronDown size={16} className={cn('shrink-0 text-ink-400 transition-transform duration-200', closed && '-rotate-90')} />
                </button>

                <div className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out-expo', !closed || mini ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')} aria-hidden={closed && !mini ? true : undefined}>
                  <div className="min-h-0 overflow-hidden">
                    <ul className={cn('mb-2.5 ml-4.75 mt-1 flex flex-col gap-0.5 border-l border-brand-100 pl-2.5', mini && 'lg:ml-0 lg:items-center lg:gap-1 lg:border-l-0 lg:pl-0')}>
                      {g.items.map((it) => {
                        const n = counts[it.to]
                        return (
                          <li key={it.to} className={cn(mini && 'lg:w-full')}>
                            <NavLink
                              to={it.to} end={it.to === '/'} onClick={onClose} title={L(it.title)} tabIndex={closed && !mini ? -1 : undefined}
                              className={({ isActive }) => cn(
                                'group relative flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-[13.5px] font-medium transition duration-200',
                                isActive ? 'bg-linear-to-r from-brand-400 via-brand-500 to-brand-700 font-semibold text-white shadow-[0_10px_22px_-8px_rgba(29,78,216,0.7)]' : 'text-ink-700 hover:translate-x-0.5 hover:bg-brand-50 hover:text-ink-900',
                                mini && 'lg:h-11 lg:justify-center lg:px-0',
                              )}
                            >
                              {({ isActive }) => (
                                <>
                                  <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition group-hover:scale-105', isActive ? 'bg-white/25 text-white' : g.tone)}><it.icon size={17} /></span>
                                  <span className={cn('flex-1 leading-tight', mini && 'lg:hidden')}>{L(it.title)}</span>
                                  {n ? (
                                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10.5px] font-bold', isActive ? 'bg-white/30 text-white' : 'bg-white text-ink-700 ring-1 ring-inset ring-line', mini && 'lg:absolute lg:-right-1 lg:-top-1 lg:min-w-4 lg:px-1 lg:text-center')}>
                                      <AnimatedNumber value={n} />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

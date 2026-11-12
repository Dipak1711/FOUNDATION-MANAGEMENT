import { Link } from 'react-router-dom'
import { Bell, Building2, ChevronDown, LogOut, PanelLeft } from 'lucide-react'
import type { Agent } from '@/types'
import { MODULES, type Row } from '@/config/modules'
import { useAuth } from '@/store/AuthContext'
import { useData } from '@/store/DataContext'
import { useLang } from '@/lib/i18n'
import { fmtDate, initials } from '@/lib/utils'
import { Popover } from '@/components/ui/Popover'
import { GlobalSearch } from './GlobalSearch'
import { LangToggle } from './LangToggle'

export function Topbar({ onToggleMenu, onLogout }: { onToggleMenu: () => void; onLogout: () => void }) {
  const { user, isAdmin } = useAuth()
  const { rows } = useData()
  const { t, L, lang } = useLang()

  const pending = MODULES.filter((m) => m.flow).flatMap((m) =>
    rows<Row>(m.coll).filter((r) => r.status === 'Pending' && (isAdmin || r.agentId === user?.id)).map((r) => ({ r, m })),
  ).sort((a, b) => (a.r.createdAt < b.r.createdAt ? 1 : -1))
  const agentsPending = isAdmin ? rows<Agent>('agents').filter((a) => a.status === 'Pending') : []
  const total = pending.length + agentsPending.length

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line-strong/60 bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:px-8">
      <button onClick={onToggleMenu} aria-label={t('openMenu')} title={t('openMenu')}
        className="grid h-10.5 w-10.5 shrink-0 place-items-center rounded-full border border-line-strong bg-white text-ink-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700">
        <PanelLeft size={18} />
      </button>
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-full border border-line-strong bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 shadow-sm xl:flex">
          <Building2 size={16} className="text-brand-600" />Purbiya Balika Foundation
        </div>
        <div className="hidden sm:block"><LangToggle /></div>

        <Popover
          trigger={({ toggle, open }) => (
            <button onClick={toggle} aria-label={t('notifications')} aria-expanded={open}
              className="relative grid h-10.5 w-10.5 place-items-center rounded-full border border-line-strong bg-white text-ink-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700">
              <Bell size={18} />
              {total > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-canvas">{total > 9 ? '9+' : total}</span>}
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <b className="text-[14px]">{t('notifications')}</b>
                {total > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{total} {t('pendingLbl')}</span>}
              </div>
              {total === 0 ? <p className="px-4 py-8 text-center text-[13px] text-ink-500">{t('allCaughtUp')}</p> : (
                <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                  {agentsPending.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <Link to="/agent-perm" onClick={close} className="flex items-start gap-3 px-4 py-3 transition hover:bg-brand-50">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                        <span className="min-w-0"><b className="block truncate text-[13px]">{a.name}</b><small className="text-ink-500">{L(['Agent awaiting approval', 'एजेंट अनुमति की प्रतीक्षा में'])}</small></span>
                      </Link>
                    </li>
                  ))}
                  {pending.slice(0, 6).map(({ r, m }) => (
                    <li key={m.coll + r.id}>
                      <Link to={'/' + m.id} onClick={close} className="flex items-start gap-3 px-4 py-3 transition hover:bg-brand-50">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warn" />
                        <span className="min-w-0">
                          <b className="block truncate text-[13px]">{String(r.brideName || r.applicantName || r.policyHolder || r.sisterName || r.balikaName)}</b>
                          <small className="text-ink-500">{r.id} · {L(m.short)} · {fmtDate(r.createdAt, lang)}</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Popover>

        <Popover width="w-64"
          trigger={({ toggle, open }) => (
            <button onClick={toggle} aria-expanded={open} className="flex items-center gap-2.5 rounded-full border border-line-strong bg-white py-1 pl-1 pr-3 shadow-sm transition hover:border-brand-400">
              <span className="grid h-8.5 w-8.5 place-items-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 text-[12px] font-extrabold text-white">{initials(user?.name ?? '')}</span>
              <span className="user-meta hidden text-left leading-tight md:block">
                <b className="block max-w-32 truncate text-[13px]">{user?.name}</b>
                <small className="text-[11.5px] text-ink-500">{isAdmin ? t('adminRole') : t('agentRole')}</small>
              </span>
              <ChevronDown size={15} className="hidden text-ink-400 md:block" />
            </button>
          )}
        >
          {(close) => (
            <div className="p-1.5">
              <div className="px-3 py-2.5"><b className="block text-[13.5px]">{user?.name}</b><small className="text-ink-500">{user?.id === 'admin' ? 'admin' : user?.id}</small></div>
              <div className="my-1 h-px bg-line" />
              <div className="px-1 py-1 sm:hidden"><LangToggle /></div>
              <button onClick={() => { close(); onLogout() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.25 text-left text-[13.5px] font-semibold text-bad transition hover:bg-bad-bg">
                <LogOut size={16} />{t('signOut')}
              </button>
            </div>
          )}
        </Popover>
      </div>
    </header>
  )
}

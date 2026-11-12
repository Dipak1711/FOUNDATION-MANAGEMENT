import { Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AGENT_ROUTES } from '@/config/nav'
import { useAuth } from '@/store/AuthContext'
import { useLang } from '@/lib/i18n'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const MINI_KEY = 'fm_sidebar_mini'

export function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const { t } = useLang()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [mini, setMini] = useState(() => { try { return localStorage.getItem(MINI_KEY) === '1' } catch { return false } })
  const [confirm, setConfirm] = useState(false)

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }) }, [pathname])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : '' }, [open])

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin && !AGENT_ROUTES.has(pathname)) return <Navigate to="/" replace />

  // The top-bar toggle opens the drawer on phones/tablets and collapses to icons on desktop.
  const toggle = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setMini((m) => { try { localStorage.setItem(MINI_KEY, m ? '0' : '1') } catch { /* ignore */ } return !m })
    } else setOpen(true)
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar open={open} mini={mini} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleMenu={toggle} onLogout={() => setConfirm(true)} />
        <main className="mx-auto w-full max-w-370 px-4.5 pb-14 pt-6 lg:px-8 lg:pt-7">
          <Suspense fallback={<div className="grid h-60 place-items-center text-ink-400">…</div>}>
            <div key={pathname} className="animate-rise"><Outlet /></div>
          </Suspense>
        </main>
      </div>
      {confirm && <ConfirmDialog title={t('signOutQ')} text={t('signOutText')} confirmLabel={t('signOut')} tone="primary" onConfirm={logout} onClose={() => setConfirm(false)} />}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User, Crown, BriefcaseBusiness, LayoutDashboard, Layers, Network } from 'lucide-react'
import type { Role } from '@/types'
import { useAuth } from '@/store/AuthContext'
import { useLang } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { BrandMark } from '@/components/layout/Sidebar'
import { LangToggle } from '@/components/layout/LangToggle'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const { user, login } = useAuth()
  const { t } = useLang()
  const [role, setRole] = useState<Role>('admin')
  const [branch, setBranch] = useState('main')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)

  if (user) return <Navigate to="/" replace />

  const fail = (msg: string) => { setError(msg); setShake((n) => n + 1) }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return fail(t('fillBoth'))
    setError(''); setBusy(true)
    // Brief verification state so the transition feels deliberate, not instantaneous.
    setTimeout(() => {
      const res = login(username, password, role, remember)
      if (!res.ok) { setBusy(false); fail(res.reason === 'blocked' ? t('agentBlocked') : t('badLogin')) }
    }, 650)
  }

  const roles = [
    { k: 'admin' as const, icon: Crown, title: t('roleAdmin'), sub: t('roleAdminSub') },
    { k: 'agent' as const, icon: BriefcaseBusiness, title: t('roleAgent'), sub: t('roleAgentSub') },
  ]
  const points = [[LayoutDashboard, t('heroP1')], [Layers, t('heroP2')], [Network, t('heroP3')]] as const

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,#2f6bff_0%,transparent_55%),radial-gradient(900px_500px_at_110%_110%,#1340b8_0%,transparent_55%),linear-gradient(160deg,var(--color-brand-900),var(--color-brand-950))] p-12 text-white lg:flex xl:p-14">
        <span aria-hidden className="absolute -right-45 top-[30%] h-130 w-130 animate-float rounded-full border border-white/12" />
        <span aria-hidden className="absolute -right-15 top-[42%] h-80 w-80 animate-float rounded-full border border-white/12 [animation-direction:reverse] [animation-duration:10s]" />
        <div className="relative z-10 flex items-center gap-3.5">
          <BrandMark className="h-11.5 w-11.5" />
          <div>
            <div className="text-[15px] font-extrabold tracking-wider">FOUNDATION MANAGEMENT</div>
            <div className="text-[11.5px] tracking-wide opacity-70">PURBIYA BALIKA FOUNDATION (REGD.)</div>
          </div>
        </div>
        <div className="relative z-10 max-w-130">
          <span className="mb-5 inline-block rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-200">{t('heroEyebrow')}</span>
          <h1 className="text-[clamp(30px,3.2vw,46px)] font-extrabold leading-[1.12] tracking-tight">{t('heroTitle')}</h1>
          <p className="mt-4.5 max-w-115 text-base text-white/80">{t('heroText')}</p>
          <ul className="mt-8 grid gap-3">
            {points.map(([Icon, label], i) => (
              <li key={i} className="flex items-center gap-3 font-medium text-white/90">
                <span className="grid h-7.5 w-7.5 place-items-center rounded-[9px] bg-white/12"><Icon size={16} /></span>{label}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 text-[12.5px] opacity-60">{t('copyright')}</div>
      </section>

      <main className="grid place-items-center bg-linear-to-b from-brand-50/50 to-brand-50 px-6 py-8 max-lg:items-start max-lg:pt-10">
        <div className="w-full max-w-107.5 animate-rise">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <BrandMark className="bg-linear-to-br from-brand-500 to-brand-700" />
            <div><div className="text-sm font-extrabold tracking-wider text-brand-900">FOUNDATION MANAGEMENT</div><div className="text-[11.5px] text-ink-500">Purbiya Balika Foundation</div></div>
          </div>
          <div className="mb-7 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">{t('welcome')}</span>
            <LangToggle />
          </div>
          <h2 className="text-[28px] font-extrabold tracking-tight">{t('signInTitle')}</h2>
          <p className="mb-6 mt-1.5 text-ink-500">{t('signInLead')}</p>

          <div className="mb-4.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup">
            {roles.map((r) => (
              <button key={r.k} type="button" role="radio" aria-checked={role === r.k} onClick={() => setRole(r.k)}
                className={cn('flex items-center gap-2.5 rounded-2xl border-[1.5px] bg-white p-3 text-left transition duration-200',
                  role === r.k ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/12' : 'border-line-strong hover:border-brand-300')}>
                <span className={cn('grid h-8.5 w-8.5 shrink-0 place-items-center rounded-[10px] transition', role === r.k ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}><r.icon size={17} /></span>
                <span><strong className="block text-[13.5px]">{r.title}</strong><small className="text-[11.5px] text-ink-500">{r.sub}</small></span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="branch" className="text-[12.5px] font-semibold text-ink-700">{t('branch')}</label>
              <select id="branch" className="control" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="main">{t('branchMain')}</option><option value="kotputli">{t('branchKot')}</option><option value="behror">{t('branchBeh')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="user" className="text-[12.5px] font-semibold text-ink-700">{t('userId')}</label>
              <div className="relative">
                <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="user" className="control pl-10.5" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pw" className="text-[12.5px] font-semibold text-ink-700">{t('password')}</label>
              <div className="relative">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="pw" type={show ? 'text' : 'password'} className="control pl-10.5 pr-12" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 grid h-8.5 w-8.5 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-brand-50 hover:text-brand-600">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-700">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4.5 w-4.5 accent-brand-600" />{t('remember')}
            </label>
            {error && <div key={shake} role="alert" className="animate-shake rounded-xl bg-bad-bg px-3.5 py-2.75 text-[13px] font-semibold text-bad">{error}</div>}
            <Button type="submit" loading={busy} className="h-12 w-full text-[15px]">{!busy && <>{t('signIn')}<ArrowRight size={18} /></>}</Button>
          </form>
          <p className="mt-5.5 flex items-center justify-center gap-2 text-[12.5px] text-ink-400"><ShieldCheck size={15} />{t('secure')}</p>
        </div>
      </main>
    </div>
  )
}

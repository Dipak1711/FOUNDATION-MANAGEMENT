import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, CheckCircle2, Clock, FileText, Gift, Hourglass, IndianRupee, LayoutDashboard, PiggyBank, Plus, Receipt, Users, Wallet, AlertTriangle } from 'lucide-react'
import type { Agent } from '@/types'
import { MODULES, type Row } from '@/config/modules'
import { buildLedger, commissionFor } from '@/lib/domain'
import { useLang } from '@/lib/i18n'
import { cn, fmtDate, inr, isDone } from '@/lib/utils'
import { useAuth } from '@/store/AuthContext'
import { useData } from '@/store/DataContext'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Sparkline } from '@/components/ui/Sparkline'
import { StatCard } from '@/components/ui/StatCard'

const APPS = MODULES.filter((m) => m.kind === 'application')
const AMOUNT_KEYS = ['amountRequested', 'requestedAmount', 'yearlyPremium', 'loanAmount']
const nameOfRow = (r: Row) => String(r.brideName || r.applicantName || r.policyHolder || r.sisterName || r.balikaName || r.id)
const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100)
const chip = (v: number) => ({ text: `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, good: v >= 0 })
const compact = (v: number) => (v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)} L` : inr(v))
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

function CollectionRing({ rate, label }: { rate: number; label: string }) {
  const size = 156, stroke = 12, radius = (size - stroke) / 2, circ = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, rate))
  const [shown, setShown] = useState(0)
  useEffect(() => { const f = requestAnimationFrame(() => setShown(clamped)); return () => cancelAnimationFrame(f) }, [clamped])
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(clamped)}% ${label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="#cfe0ff" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#ring)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 1400ms cubic-bezier(0.16,1,0.3,1)', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-[34px] font-extrabold leading-none tracking-tight"><AnimatedNumber value={clamped} format={(v) => `${Math.round(v)}%`} duration={1400} /></span>
        <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/80">{label}</span>
      </div>
    </div>
  )
}

function HeroTile({ label, icon, value, format, chipData, spark }: { label: string; icon: ReactNode; value: number; format: (v: number) => string; chipData: { text: string; good: boolean }; spark?: number[] }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/90 p-4 shadow-[0_10px_24px_-14px_rgba(7,23,63,0.6)] ring-1 ring-white/70 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white">
      <span className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-brand-500 to-brand-500/10" aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-500">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-100 text-brand-700">{icon}</span>{label}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums', chipData.good ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad')}>{chipData.text}</span>
      </div>
      <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight text-ink-900"><AnimatedNumber value={value} format={format} duration={1100} /></p>
      <div className="mt-2">{spark ? <Sparkline data={spark} tone="blue" /> : <div className="h-7.5" />}</div>
    </div>
  )
}

const CardTitle = ({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-2.5">
      <span className="mt-1 h-4.5 w-1 rounded-full bg-linear-to-b from-brand-400 to-brand-700" />
      <div><h3 className="text-[15.5px] font-bold leading-tight">{title}</h3>{sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}</div>
    </div>{action}
  </div>
)

const tip = { borderRadius: 12, border: '1px solid #e4eaf5', boxShadow: '0 8px 24px rgba(19,64,184,.12)', fontSize: 12.5 }

export function DashboardPage() {
  const { t, L, lang } = useLang()
  const { user, isAdmin } = useAuth()
  const { rows, rates, data } = useData()
  const nav = useNavigate()

  const m = useMemo(() => {
    const mine = (r: Row) => isAdmin || r.agentId === user?.id
    const apps = APPS.flatMap((mod) => rows<Row>(mod.coll).filter(mine).map((r) => ({ r, mod }))).sort((a, b) => (a.r.createdAt < b.r.createdAt ? 1 : -1))
    const ledger = buildLedger((c) => rows(c))
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return { key: monthKey(d), label: d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' }) }
    })
    const bucket = <T,>(items: T[], date: (x: T) => string, val: (x: T) => number) =>
      months.map((mo) => items.filter((x) => monthKey(new Date(date(x))) === mo.key).reduce((s, x) => s + val(x), 0))
    const outL = ledger.filter((x) => x.dir === 'out' && x.collection !== 'payouts')
    const inL = ledger.filter((x) => x.dir === 'in')
    const cash = months.map((mo, i) => ({ name: mo.label, in: bucket(inL, (x) => x.date, (x) => x.amount)[i], out: bucket(outL, (x) => x.date, (x) => x.amount)[i] }))
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 864e5), k = d.toISOString().slice(0, 10)
      return { name: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: inL.filter((x) => x.date.slice(0, 10) === k).reduce((s, x) => s + x.amount, 0) }
    })
    const agents = rows<Agent>('agents')
    const comm = agents.map((a) => ({ a, c: commissionFor(a.id, (c) => rows(c), rates) }))
    const done = apps.filter((a) => isDone(a.r.status)).length
    const pending = apps.filter((a) => a.r.status === 'Pending').length
    const rejected = apps.filter((a) => a.r.status === 'Rejected').length
    const appSeries = bucket(apps, (x) => x.r.createdAt, () => 1)
    return {
      apps, total: apps.length, done, pending, rejected, cash, days, comm,
      disbursed: outL.reduce((s, x) => s + x.amount, 0), collected: inL.reduce((s, x) => s + x.amount, 0),
      outSeries: cash.map((c) => c.out), inSeries: cash.map((c) => c.in),
      appSeries, doneSeries: bucket(apps.filter((a) => isDone(a.r.status)), (x) => x.r.createdAt, () => 1), pendSeries: bucket(apps.filter((a) => a.r.status === 'Pending'), (x) => x.r.createdAt, () => 1),
      activeAgents: agents.filter((a) => a.status === 'Active').length, pendingAgents: agents.filter((a) => a.status === 'Pending'),
      commPending: comm.reduce((s, x) => s + x.c.pending, 0),
      recentTxns: ledger.slice(0, 5),
      byScheme: APPS.map((mod) => ({ mod, n: rows<Row>(mod.coll).filter(mine).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n),
      status: [{ name: L(['Approved / completed', 'स्वीकृत / पूर्ण']), value: done, color: '#2f6bff' }, { name: L(['Pending', 'लंबित']), value: pending, color: '#f2a93b' }, { name: L(['Rejected', 'अस्वीकृत']), value: rejected, color: '#d6384f' }],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, rates, isAdmin, user, lang])

  const last = <T,>(a: T[], n = 1) => a[a.length - n] ?? (0 as T)
  /** Month-over-month change between the last two complete months (the current month is partial). */
  const mom = (a: number[]) => chip(pct(last(a, 2), last(a, 3)))
  const hour = new Date().getHours()
  const greet = lang === 'hi' ? (hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्कार' : 'शुभ संध्या') : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const rate = m.total ? (m.done / m.total) * 100 : 0
  const max = Math.max(1, ...m.byScheme.map((x) => x.n))
  const attention = [
    ...m.pendingAgents.map((a) => ({ id: a.id, label: a.name, detail: L(['Agent awaiting approval', 'एजेंट अनुमति की प्रतीक्षा में']), to: '/agent-perm', sev: 'violet' })),
    ...m.apps.filter((a) => a.r.status === 'Pending').slice(0, 8).map(({ r, mod }) => ({ id: mod.coll + r.id, label: nameOfRow(r), detail: `${r.id} · ${L(mod.short)} · ${L(['awaiting review', 'समीक्षा लंबित'])}`, to: '/' + mod.id, sev: 'amber' })),
  ]

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow={`${greet}, ${user?.name.split(' ')[0] ?? ''}`} icon={<LayoutDashboard size={22} />}
        title={L(['Foundation Dashboard', 'फाउंडेशन डैशबोर्ड'])} desc={t('dashText')}
        actions={<>
          <Button variant="ghost" icon={<FileText size={17} />} onClick={() => nav('/mayra-app', { state: { add: true } })}>{L(['New Mayra application', 'नया मायरा आवेदन'])}</Button>
          <Button icon={<Plus size={17} />} onClick={() => nav('/marriage-app', { state: { add: true } })}>{L(['New marriage application', 'नया विवाह आवेदन'])}</Button>
        </>}
      />

      {/* Hero band */}
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,var(--color-brand-800),var(--color-brand-600)_55%,var(--color-brand-400))] p-5 text-white shadow-[0_18px_40px_rgba(29,78,216,0.32)] lg:p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-brand-950/40 blur-3xl" />
        <IndianRupee aria-hidden className="pointer-events-none absolute -bottom-10 -right-6 h-56 w-56 -rotate-12 text-white/5" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[auto_1fr] lg:gap-8">
          <div className="flex flex-col items-center gap-3">
            <CollectionRing rate={rate} label={L(['Approved', 'स्वीकृत'])} />
            <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-ok" /></span>
              <span className="text-[11.5px] font-semibold text-brand-950">{m.total} {L(['applications', 'आवेदन'])} · {m.pending} {L(['pending', 'लंबित'])}</span>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-[20px] font-extrabold tracking-tight lg:text-2xl">{L(['Assistance and collections at a glance', 'सहायता और संकलन एक नज़र में'])}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {isAdmin ? (<>
                <HeroTile label={L(['Disbursed', 'वितरित'])} icon={<Receipt size={16} />} value={m.disbursed} format={compact} chipData={mom(m.outSeries)} spark={m.outSeries} />
                <HeroTile label={L(['Collected', 'संकलित'])} icon={<Wallet size={16} />} value={m.collected} format={compact} chipData={mom(m.inSeries)} spark={m.inSeries} />
                <HeroTile label={L(['Commission due', 'देय कमिशन'])} icon={<Hourglass size={16} />} value={m.commPending} format={compact} chipData={{ text: `${m.comm.filter((x) => x.c.pending > 0).length} ${L(['agents', 'एजेंट'])}`, good: m.commPending === 0 }} />
              </>) : (<>
                <HeroTile label={t('statTotal')} icon={<FileText size={16} />} value={m.total} format={(v) => String(Math.round(v))} chipData={mom(m.appSeries)} spark={m.appSeries} />
                <HeroTile label={t('statApproved')} icon={<CheckCircle2 size={16} />} value={m.done} format={(v) => String(Math.round(v))} chipData={mom(m.doneSeries)} spark={m.doneSeries} />
                <HeroTile label={t('statPending')} icon={<Clock size={16} />} value={m.pending} format={(v) => String(Math.round(v))} chipData={{ text: m.pending ? L(['needs review', 'समीक्षा']) : 'OK', good: m.pending === 0 }} spark={m.pendSeries} />
              </>)}
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t('statTotal')} numeric={m.total} icon={<FileText size={20} />} tone="blue" spark={m.appSeries} trend={mom(m.appSeries)} hint={L(['All schemes, this and earlier months', 'सभी योजनाएँ'])} />
        <StatCard label={t('statApproved')} numeric={m.done} icon={<CheckCircle2 size={20} />} tone="green" spark={m.doneSeries} hint={`${Math.round(rate)}% ${L(['of all applications', 'आवेदनों का'])}`} />
        <StatCard label={t('statPending')} numeric={m.pending} icon={<Clock size={20} />} tone="amber" spark={m.pendSeries} hint={m.pending ? L(['Awaiting your decision', 'आपके निर्णय की प्रतीक्षा']) : L(['Nothing waiting', 'कुछ लंबित नहीं'])} />
        {isAdmin && <>
          <StatCard label={t('statDisbursed')} numeric={m.disbursed} format={compact} icon={<Gift size={20} />} tone="navy" spark={m.outSeries} hint={L(['Marriage, Mayra and aid payments', 'विवाह, मायरा व सहायता भुगतान'])} />
          <StatCard label={t('statAgents')} numeric={m.activeAgents} icon={<Users size={20} />} tone="violet" hint={m.pendingAgents.length ? `${m.pendingAgents.length} ${L(['awaiting approval', 'अनुमति प्रतीक्षित'])}` : L(['All approved', 'सभी स्वीकृत'])} />
          <StatCard label={t('statEmi')} numeric={m.collected} format={compact} icon={<PiggyBank size={20} />} tone="green" spark={m.inSeries} hint={L(['Premiums, loan EMIs and bulk batches', 'प्रीमियम, ऋण ईएमआई व बल्क'])} />
        </>}
      </div>

      {/* Charts */}
      {isAdmin && <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <>
          <div className="card p-5.5">
            <CardTitle title={L(['Disbursed vs Collected (Monthly)', 'वितरण बनाम संकलन (मासिक)'])} sub={t('cashflow')} />
            <div className="mt-3 h-62.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.cash} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={6}>
                  <CartesianGrid stroke="#e4eaf5" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#62708f', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#62708f', fontSize: 12 }} tickFormatter={(v: number) => (v >= 1e5 ? `${v / 1e5}L` : v >= 1000 ? `${v / 1000}k` : String(v))} />
                  <Tooltip formatter={(v) => inr(v)} cursor={{ fill: 'rgba(47,107,255,0.06)' }} contentStyle={tip} />
                  <Bar dataKey="out" name={t('outgoing')} fill="#0f2f8f" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="in" name={t('incoming')} fill="#5b8cff" radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-[12.5px] text-ink-500">
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-brand-800" />{t('outgoing')}</span>
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-brand-400" />{t('incoming')}</span>
            </div>
          </div>
          <div className="card p-5.5">
            <CardTitle title={L(['Collections Trend (Last 30 Days)', 'संकलन रुझान (पिछले 30 दिन)'])} sub={L(['Daily premiums and EMIs received', 'दैनिक प्रीमियम व ईएमआई'])} />
            <div className="mt-3 h-62.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m.days} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="trend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f9d6b" stopOpacity={0.3} /><stop offset="100%" stopColor="#0f9d6b" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#e4eaf5" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval={6} tick={{ fill: '#62708f', fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#62708f', fontSize: 12 }} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                  <Tooltip formatter={(v) => inr(v)} contentStyle={tip} />
                  <Area type="monotone" dataKey="value" name={t('incoming')} stroke="#0f9d6b" strokeWidth={2.5} fill="url(#trend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      </div>}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div className="card p-5.5">
          <CardTitle title={L(['Application status', 'आवेदन स्थिति'])} sub={L(['Across all welfare schemes', 'सभी योजनाओं में'])} />
          {m.total === 0 ? <EmptyState title={t('emptyTitle')} text={t('noChart')} /> : (
            <div className="relative mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={m.status} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">{m.status.map((s) => <Cell key={s.name} fill={s.color} />)}</Pie>
                  <Tooltip contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><div className="text-[28px] font-extrabold leading-none">{m.total}</div><div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-ink-400">{L(['Total', 'कुल'])}</div></div></div>
            </div>
          )}
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-ink-500">{m.status.map((s) => <span key={s.name}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.name} · {s.value}</span>)}</div>
        </div>

        <div className="card p-5.5">
          <CardTitle title={t('byScheme')} sub={L(['Number of applications', 'आवेदनों की संख्या'])} />
          {m.byScheme.length ? (
            <div className="mt-4 grid gap-3.5">
              {m.byScheme.map(({ mod, n }) => (
                <Link key={mod.id} to={'/' + mod.id} className="group block">
                  <div className="mb-1.5 flex justify-between text-[13px] font-semibold"><span className="group-hover:text-brand-700">{L(mod.short)}</span><span className="tabular-nums text-ink-500">{n}</span></div>
                  <div className="h-2.25 overflow-hidden rounded-full bg-brand-50"><div className="h-full rounded-full bg-linear-to-r from-brand-400 to-brand-600 transition-[width] duration-1000 ease-out-expo" style={{ width: `${(n / max) * 100}%` }} /></div>
                </Link>
              ))}
            </div>
          ) : <EmptyState title={t('emptyTitle')} text={t('noChart')} />}
        </div>

        {isAdmin ? (
          <div className="card p-5.5">
            <CardTitle title={L(['Top agents', 'शीर्ष एजेंट'])} sub={L(['By entries submitted', 'जमा प्रविष्टियों के अनुसार'])} />
            {m.comm.filter((x) => x.c.total).length === 0 ? <EmptyState title={t('emptyTitle')} text={t('noChart')} /> : (
              <ol className="mt-3.5 flex flex-col gap-3">
                {[...m.comm].sort((a, b) => b.c.total - a.c.total).slice(0, 5).map(({ a, c }, i) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-inset ring-line">{i + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{a.name}</span><span className="block truncate text-xs text-ink-500">{a.district} · {a.block}</span></span>
                    <span className="text-right"><b className="block text-[13px] tabular-nums">{c.total}</b><small className="text-[11px] text-ink-400">{L(['entries', 'प्रविष्टि'])}</small></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-hidden">
          <div className="p-5.5 pb-3"><CardTitle title={t('recentApps')} sub={L(['Latest applications across all schemes', 'सभी योजनाओं के नवीनतम आवेदन'])} /></div>
          {m.apps.length === 0 ? <EmptyState title={t('emptyTitle')} text={t('emptyText')} /> : (
            <div className="overflow-x-auto max-sm:overflow-visible">
              <table className="data-table">
                <thead><tr><th>{t('type')}</th><th>{t('appId')}</th><th>{t('date')}</th><th>{t('applicant')}</th><th className="text-right">{t('amount')}</th><th>{t('statusL')}</th></tr></thead>
                <tbody>
                  {m.apps.slice(0, 7).map(({ r, mod }) => {
                    const amountKey = AMOUNT_KEYS.find((k) => r[k])
                    return (
                      <tr key={mod.coll + r.id} className="cursor-pointer" onClick={() => nav('/' + mod.id)}>
                        <td data-label={t('type')}><Badge tone="info">{L(mod.short)}</Badge></td>
                        <td data-label={t('appId')}><span className="whitespace-nowrap font-bold tabular-nums text-brand-700">{r.id}</span></td>
                        <td data-label={t('date')}>{fmtDate(r.createdAt, lang)}</td>
                        <td data-label={t('applicant')} className="font-semibold">{nameOfRow(r)}</td>
                        <td data-label={t('amount')} className="text-right font-bold tabular-nums">{amountKey ? inr(r[amountKey]) : '—'}</td>
                        <td data-label={t('statusL')}><StatusBadge status={r.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5.5">
          <CardTitle title={L(['Needs attention', 'ध्यान देने योग्य'])} sub={`${attention.length} ${L(['open items', 'खुले आइटम'])}`}
            action={<Link to="/marriage-app" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:text-brand-800">{t('viewAll')}<ArrowUpRight size={14} /></Link>} />
          {attention.length === 0 ? <EmptyState icon={<AlertTriangle size={30} />} title={L(['All caught up', 'सब ठीक है'])} text={t('allCaughtUp')} /> : (
            <ul className="mt-3 flex max-h-95 flex-col divide-y divide-line overflow-y-auto">
              {attention.slice(0, 9).map((a) => (
                <li key={a.id}>
                  <Link to={a.to} className="flex items-start gap-3 py-2.5 transition-colors hover:bg-brand-50/60">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.sev === 'violet' ? 'bg-violet-500' : 'bg-warn')} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{a.label}</span><span className="block truncate text-xs text-ink-500">{a.detail}</span></span>
                    <Badge tone={a.sev === 'violet' ? 'info' : 'warn'}>{t('pendingLbl')}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

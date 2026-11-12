import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Check, Eye, HandCoins, Plus, Printer, Trash2, X } from 'lucide-react'
import type { Agent, FieldDef, Status } from '@/types'
import { MODULE_BY_ID, type ColumnDef, type Ctx, type ModuleDef, type Row } from '@/config/modules'
import { agentNameOf } from '@/lib/domain'
import { useLang } from '@/lib/i18n'
import { fmtDate, inr, num, today } from '@/lib/utils'
import { useAuth } from '@/store/AuthContext'
import { useData } from '@/store/DataContext'
import { useToast } from '@/store/ToastContext'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FormModal } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Receipt, type ReceiptData } from '@/components/ui/Receipt'
import { StatusBadge, statusLabel } from '@/components/ui/Badge'

export function ModulePage() {
  const { pathname } = useLocation()
  const def = MODULE_BY_ID[pathname.replace(/^\//, '')]
  if (!def) return <Navigate to="/" replace />
  return <ModuleView key={def.id} def={def} />
}

function ModuleView({ def }: { def: ModuleDef }) {
  const { t, L, lang } = useLang()
  const { user, isAdmin } = useAuth()
  const { rows, add, update, remove } = useData()
  const toast = useToast()
  const agents = rows<Agent>('agents')

  const [adding, setAdding] = useState(() => !!(history.state?.usr as { add?: boolean } | null)?.add)
  const [viewing, setViewing] = useState<Row | null>(null)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [emiFor, setEmiFor] = useState<Row | null>(null)

  const ctx: Ctx = useMemo(() => ({ L, lang, rows: (c) => rows(c), agentName: (id) => agentNameOf(agents, id) }), [L, lang, rows, agents])
  const all = rows<Row>(def.coll)
  const data = useMemo(() => [...(isAdmin || !def.agentLinked ? all : all.filter((r) => r.agentId === user?.id))].reverse(), [all, isAdmin, user, def.agentLinked])

  // Attribution: admins pick an agent (or leave direct); agents are always recorded as themselves.
  const fields: FieldDef[] = useMemo(() => {
    if (!def.agentLinked || !isAdmin) return def.fields
    const active = agents.filter((a) => a.status === 'Active')
    return [...def.fields, { name: 'agentId', label: [t('submittedBy'), t('submittedBy')], type: 'select', full: true, options: active.map((a) => [a.id, `${a.name} (${a.id})`, `${a.name} (${a.id})`] as const), hint: [t('directEntry'), t('directEntry')] }]
  }, [def, isAdmin, agents, t])

  const columns: Column<Row>[] = useMemo(() => {
    const cols = def.columns.filter((c) => c.key !== 'agent' || isAdmin)
    return cols.map((c: ColumnDef) => ({ key: c.key, header: L(c.h), align: c.align, render: (r: Row) => c.r(r, ctx), csv: (r: Row) => c.csv?.(r, ctx) ?? '' }))
  }, [def, isAdmin, L, ctx])

  const create = (v: Record<string, string>) => {
    const rec: Record<string, unknown> = { status: def.defaultStatus }
    for (const f of fields) {
      const val = v[f.name]
      rec[f.name] = f.type === 'number' ? num(val) : val
    }
    if (def.agentLinked) rec.agentId = isAdmin ? v.agentId || undefined : user?.id
    add(def.coll, def.prefix, rec)
    toast(t('saved'))
  }

  const setStatus = (r: Row, s: Status) => { update(def.coll, r.id, { status: s }); toast(t('updated')) }
  const label = def.flow ? def.flow.statuses.map((s) => ({ value: s, label: statusLabel(s, L) })) : undefined
  const searchText = (r: Row) => Object.values(r).join(' ') + ' ' + (r.agentId ? ctx.agentName(r.agentId) : '')

  return (
    <>
      <PageHeader eyebrow={L(def.short)} title={L(def.title)} desc={L(def.desc)}
        actions={<Button icon={<Plus size={18} />} onClick={() => setAdding(true)}>{L(def.addLabel)}</Button>} />

      <div className="card overflow-hidden">
        <DataTable<Row>
          rows={data} columns={columns} searchText={searchText} statuses={label} getStatus={(r) => r.status}
          csvName={def.id} emptyIcon={<def.icon size={34} />} emptyTitle={t('emptyTitle')} emptyText={t('emptyText')}
          onAdd={() => setAdding(true)} addLabel={L(def.addLabel)} onRowClick={setViewing}
          actions={(r) => (
            <ActionMenu items={[
              { label: def.flow ? L(def.flow.approveLabel) : '', icon: <Check size={16} />, tone: 'success', hidden: !(def.flow && r.status === 'Pending' && isAdmin), onClick: () => setStatus(r, def.flow!.approveStatus) },
              { label: t('reject'), icon: <X size={16} />, tone: 'danger', hidden: !(def.flow && r.status === 'Pending' && isAdmin), onClick: () => setStatus(r, 'Rejected') },
              { label: t('recordEmi'), icon: <HandCoins size={16} />, hidden: !(def.extra === 'loanEmi' && r.status === 'Approved' && balance(r, ctx) > 0), onClick: () => setEmiFor(r) },
              { label: t('view'), icon: <Eye size={16} />, onClick: () => setViewing(r) },
              { label: def.print ? L(def.print.label) : '', icon: <Printer size={16} />, hidden: !def.print, onClick: () => setReceipt(def.print!.build(r, ctx)) },
              { label: t('delete'), icon: <Trash2 size={16} />, tone: 'danger', hidden: !isAdmin, onClick: () => setDeleting(r) },
            ]} />
          )}
        />
      </div>

      {adding && <FormModal title={L(def.formTitle)} subtitle={L(def.desc)} fields={fields} onSubmit={create} onClose={() => setAdding(false)} />}
      {viewing && <Detail def={def} row={viewing} ctx={ctx} onClose={() => setViewing(null)} onPrint={def.print ? () => { setReceipt(def.print!.build(viewing, ctx)); setViewing(null) } : undefined} />}
      {receipt && <Receipt data={receipt} onClose={() => setReceipt(null)} />}
      {deleting && <ConfirmDialog title={t('confirmDelete')} text={t('confirmDeleteText')} onConfirm={() => { remove(def.coll, deleting.id); toast(t('deleted')) }} onClose={() => setDeleting(null)} />}
      {emiFor && <EmiModal loan={emiFor} ctx={ctx} onClose={() => setEmiFor(null)} />}
    </>
  )
}

const balance = (loan: Row, ctx: Ctx) => num(loan.loanAmount) - ctx.rows('loanEmi').filter((e) => e.loanId === loan.id).reduce((s, e) => s + num(e.amount), 0)

function EmiModal({ loan, ctx, onClose }: { loan: Row; ctx: Ctx; onClose: () => void }) {
  const { t, L } = useLang()
  const { add } = useData()
  const toast = useToast()
  const bal = balance(loan, ctx)
  const emi = Math.min(bal, Math.ceil(num(loan.loanAmount) / num(loan.tenureMonths)))
  const fields: FieldDef[] = [
    { name: 'amount', label: [t('emiAmount'), t('emiAmount')], type: 'number', valid: 'amount', required: true, def: emi, hint: [`${t('balLbl')}: ${inr(bal)}`, `${t('balLbl')}: ${inr(bal)}`] },
    { name: 'date', label: ['Date', 'तिथि'], type: 'date', required: true, def: today },
    { name: 'paymentMode', label: [t('payMode'), t('payMode')], type: 'select', required: true, def: 'Cash', full: true, options: [['Cash', 'Cash', 'नकद'], ['UPI', 'UPI', 'UPI'], ['Bank Transfer (NEFT)', 'Bank transfer', 'बैंक ट्रांसफर']] },
  ]
  return (
    <FormModal title={t('recordEmi')} subtitle={`${loan.id} · ${loan.applicantName}`} fields={fields} size="sm" onClose={onClose}
      extraValidate={(v) => (num(v.amount) > bal ? { amount: t('emiOver') } : {})}
      onSubmit={(v) => { add('loanEmi', 'EMI', { loanId: loan.id, borrower: loan.applicantName, amount: num(v.amount), date: v.date, paymentMode: v.paymentMode }); toast(L(['EMI recorded', 'ईएमआई दर्ज हुई'])) }} />
  )
}

function Detail({ def, row, ctx, onClose, onPrint }: { def: ModuleDef; row: Row; ctx: Ctx; onClose: () => void; onPrint?: () => void }) {
  const { t, L, lang } = useLang()
  const show = (f: FieldDef) => {
    const v = row[f.name]
    if (v === undefined || v === '') return '—'
    if (f.type === 'select') { const o = f.options?.find((x) => x[0] === String(v)); return o ? L([o[1], o[2]]) : String(v) }
    if (f.type === 'date') return fmtDate(v, lang)
    if (f.valid === 'amount' && f.type === 'number' && /amount|premium|fee/i.test(f.name)) return inr(v)
    return String(v)
  }
  const items: Array<[string, React.ReactNode]> = [
    [t('statusL'), row.status ? <StatusBadge status={row.status} /> : '—'],
    ...def.fields.map((f): [string, React.ReactNode] => [L(f.label), show(f)]),
    ...(def.agentLinked ? [[L(['Agent', 'एजेंट']), row.agentId ? ctx.agentName(row.agentId) : t('directEntry')] as [string, React.ReactNode]] : []),
    [L(['Created', 'दर्ज']), fmtDate(row.createdAt, lang)],
  ]
  return (
    <Modal drawer title={row.id} subtitle={L(def.title)} onClose={onClose}
      footer={onPrint && <Button icon={<Printer size={17} />} onClick={onPrint}>{L(def.print!.label)}</Button>}>
      <dl>
        {items.map(([k, v], i) => (
          <div key={i} className="flex justify-between gap-4.5 border-b border-dashed border-line-strong py-3">
            <dt className="text-[13px] font-semibold text-ink-500">{k}</dt>
            <dd className="break-words text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

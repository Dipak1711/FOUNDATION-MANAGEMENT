import { useMemo, useState } from 'react'
import { Check, Pause, Pencil, Plus, Printer, Wallet, UserPlus, HandCoins, Users, TrendingUp, Clock } from 'lucide-react'
import type { Agent, FieldDef } from '@/types'
import { COMMISSION_COLLS, MODULE_BY_COLL } from '@/config/modules'
import { commissionFor } from '@/lib/domain'
import { useLang } from '@/lib/i18n'
import { fmtDate, hashPw, inr, num, today } from '@/lib/utils'
import { useData } from '@/store/DataContext'
import { useToast } from '@/store/ToastContext'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Button } from '@/components/ui/Button'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FormModal } from '@/components/ui/Form'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'

const main = (a: React.ReactNode, b?: React.ReactNode) => (<><div className="max-w-36 truncate font-semibold">{a}</div>{b ? <div className="max-w-36 truncate text-xs text-ink-500">{b}</div> : null}</>)
const idc = (v: string) => <span className="whitespace-nowrap font-bold tabular-nums text-brand-700">{v}</span>
const amt = (v: number, cls = '') => <span className={`whitespace-nowrap font-bold tabular-nums ${cls}`}>{inr(v)}</span>

/* ---------------- Registration ---------------- */
export function AgentRegPage() {
  const { t, L, lang } = useLang()
  const { rows, add } = useData()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const agents = rows<Agent>('agents')

  const fields: FieldDef[] = [
    { name: 'name', label: ['Full name', 'पूरा नाम'], required: true, section: ['Personal', 'व्यक्तिगत'] },
    { name: 'mobile', label: ['Mobile number', 'मोबाइल नंबर'], type: 'tel', valid: 'mobile', required: true },
    { name: 'aadhaar', label: ['Aadhaar number', 'आधार नंबर'], valid: 'aadhaar', required: true, ph: ['XXXX XXXX XXXX', 'XXXX XXXX XXXX'] },
    { name: 'email', label: ['Email', 'ईमेल'], type: 'email', valid: 'email', ph: ['agent@foundation.org', 'agent@foundation.org'] },
    { name: 'district', label: ['District', 'जिला'], required: true, section: ['Jurisdiction', 'अधिकार क्षेत्र'] },
    { name: 'block', label: ['Block', 'ब्लॉक'], required: true },
    { name: 'assignedPanchayats', label: ['Assigned panchayats / wards', 'आवंटित पंचायत / वार्ड'], full: true, ph: ['Gram panchayat or ward numbers', 'ग्राम पंचायत या वार्ड संख्या'] },
    { name: 'password', label: [t('agentPassword'), t('agentPassword')], type: 'password', required: true, full: true, hint: [t('agentPasswordHint'), t('agentPasswordHint')], section: ['Access', 'एक्सेस'] },
  ]

  const columns: Column<Agent>[] = [
    { key: 'id', header: L(['Agent ID', 'एजेंट आईडी']), render: (r) => idc(r.id), csv: (r) => r.id },
    { key: 'n', header: L(['Name & email', 'नाम व ईमेल']), render: (r) => main(r.name, r.email), csv: (r) => r.name },
    { key: 'm', header: L(['Mobile', 'मोबाइल']), render: (r) => r.mobile, csv: (r) => r.mobile },
    { key: 'd', header: L(['District & block', 'जिला व ब्लॉक']), render: (r) => `${r.district} – ${r.block}`, csv: (r) => `${r.district} ${r.block}` },
    { key: 'p', header: L(['Panchayat / ward', 'पंचायत / वार्ड']), render: (r) => r.assignedPanchayats || '—' },
    { key: 's', header: L(['Status', 'स्थिति']), render: (r) => <StatusBadge status={r.status} />, csv: (r) => r.status },
    { key: 'j', header: L(['Joined', 'पंजीकरण तिथि']), render: (r) => fmtDate(r.createdAt, lang) },
  ]

  return (
    <>
      <PageHeader eyebrow={L(['Agents', 'एजेंट'])} title={L(['Agent Registration', 'एजेंट आवेदन'])} desc={L(['Field worker and agent registration portal.', 'क्षेत्रीय कार्यकर्ता व एजेंट पंजीकरण पोर्टल।'])}
        actions={<Button icon={<Plus size={18} />} onClick={() => setOpen(true)}>{L(['Register new agent', 'नया एजेंट पंजीकृत करें'])}</Button>} />
      <div className="card overflow-hidden">
        <DataTable<Agent> rows={[...agents].reverse()} columns={columns} searchText={(r) => `${r.id} ${r.name} ${r.mobile} ${r.district} ${r.block}`}
          statuses={(['Pending', 'Active', 'Suspended'] as const).map((s) => ({ value: s, label: s }))} getStatus={(r) => r.status} csvName="agents"
          emptyIcon={<UserPlus size={34} />} emptyTitle={t('emptyTitle')} emptyText={L(['Register your first field agent to start attributing applications.', 'आवेदन जोड़ने के लिए पहला क्षेत्रीय एजेंट पंजीकृत करें।'])}
          onAdd={() => setOpen(true)} addLabel={L(['Register new agent', 'नया एजेंट पंजीकृत करें'])} />
      </div>
      {open && <FormModal title={L(['Register new agent', 'नया एजेंट / कार्यकर्ता पंजीकरण'])} fields={fields}
        extraValidate={(v) => (agents.some((a) => a.mobile === v.mobile) ? { mobile: L(['This mobile is already registered', 'यह मोबाइल पहले से पंजीकृत है']) } : {})}
        onSubmit={(v) => {
          const { password, ...rest } = v
          add('agents', 'AGT', { ...rest, status: 'Pending', permission: 'Awaiting approval', hash: hashPw(password) })
          toast(L(['Agent registered — awaiting your approval.', 'एजेंट पंजीकृत — आपकी अनुमति की प्रतीक्षा है।']))
        }} onClose={() => setOpen(false)} />}
    </>
  )
}

/* ---------------- Permissions ---------------- */
export function AgentPermPage() {
  const { t, L } = useLang()
  const { rows, update } = useData()
  const toast = useToast()
  const agents = rows<Agent>('agents')
  const set = (a: Agent, status: 'Active' | 'Suspended', permission: string) => { update('agents', a.id, { status, permission }); toast(t('updated')) }

  const columns: Column<Agent>[] = [
    { key: 'id', header: L(['Agent code', 'एजेंट कोड']), render: (r) => idc(r.id), csv: (r) => r.id },
    { key: 'n', header: L(['Agent', 'एजेंट']), render: (r) => main(r.name, r.district), csv: (r) => r.name },
    { key: 'j', header: L(['Jurisdiction', 'अधिकार क्षेत्र']), render: (r) => r.assignedPanchayats || r.block },
    { key: 'p', header: t('permLevel'), render: (r) => <Badge tone="info">{r.permission}</Badge>, csv: (r) => r.permission },
    { key: 's', header: L(['Account', 'खाता स्थिति']), render: (r) => <StatusBadge status={r.status} />, csv: (r) => r.status },
  ]
  return (
    <>
      <PageHeader eyebrow={L(['Agents', 'एजेंट'])} title={L(['Agent Permissions', 'एजेंट की अनुमति'])} desc={L(['Verify agents, grant access and manage authority.', 'एजेंट सत्यापन, अनुमति स्वीकृति एवं अधिकार प्रबंधन।'])} />
      <div className="card overflow-hidden">
        <DataTable<Agent> rows={[...agents].reverse()} columns={columns} searchText={(r) => `${r.id} ${r.name} ${r.district}`} emptyTitle={t('emptyTitle')} emptyText={t('noAgents')}
          actions={(r) => (
            <ActionMenu items={[
              { label: t('grant'), icon: <Check size={16} />, tone: 'success', hidden: r.status === 'Active', onClick: () => set(r, 'Active', 'Full Access') },
              { label: t('suspend'), icon: <Pause size={16} />, tone: 'danger', hidden: r.status !== 'Active', onClick: () => set(r, 'Suspended', 'Suspended') },
            ]} />
          )} />
      </div>
    </>
  )
}

/* ---------------- shared commission table data ---------------- */
function useCommissionRows() {
  const { rows, rates } = useData()
  const agents = rows<Agent>('agents')
  return useMemo(() => agents.map((a) => ({ ...a, c: commissionFor(a.id, (x) => rows(x), rates) })), [agents, rows, rates])
}
type CRow = ReturnType<typeof useCommissionRows>[number]

/* ---------------- Commission payment ---------------- */
export function AgentPayPage() {
  const { t, L, lang } = useLang()
  const { rows, rates, add, setRates } = useData()
  const toast = useToast()
  const list = useCommissionRows()
  const [paying, setPaying] = useState(false)
  const [editing, setEditing] = useState(false)
  const totals = list.reduce((s, a) => ({ e: s.e + a.c.earned, p: s.p + a.c.paid, d: s.d + a.c.pending }), { e: 0, p: 0, d: 0 })
  const payouts = [...rows('payouts')].reverse()

  const columns: Column<CRow>[] = [
    { key: 'id', header: L(['Agent code', 'एजेंट कोड']), render: (r) => idc(r.id), csv: (r) => r.id },
    { key: 'n', header: L(['Agent & district', 'एजेंट नाम व जिला']), render: (r) => main(r.name, r.district), csv: (r) => r.name },
    { key: 'a', header: L(['Applications', 'कुल आवेदन']), render: (r) => r.c.total, csv: (r) => r.c.total },
    { key: 'e', header: L(['Earned', 'अर्जित']), render: (r) => amt(r.c.earned), csv: (r) => r.c.earned },
    { key: 'p', header: L(['Paid', 'भुगतान हुआ']), render: (r) => amt(r.c.paid), csv: (r) => r.c.paid },
    { key: 'd', header: L(['Pending', 'देय']), render: (r) => amt(r.c.pending, r.c.pending ? 'text-warn' : ''), csv: (r) => r.c.pending },
    { key: 's', header: L(['Status', 'स्थिति']), render: (r) => <StatusBadge status={r.status} /> },
  ]

  const payFields: FieldDef[] = [
    { name: 'agentId', label: [t('selectAgent'), t('selectAgent')], type: 'select', required: true, full: true, options: list.filter((a) => a.c.pending > 0).map((a) => [a.id, `${a.name} (${a.id}) — ${t('pendingLbl')}: ${inr(a.c.pending)}`, `${a.name} (${a.id}) — ${t('pendingLbl')}: ${inr(a.c.pending)}`] as const) },
    { name: 'amount', label: [t('amount'), t('amount')] as never, type: 'number', valid: 'amount', required: true },
    { name: 'date', label: ['Date', 'तिथि'], type: 'date', required: true, def: today },
    { name: 'paymentMode', label: [t('payMode'), t('payMode')], type: 'select', required: true, def: 'Direct Bank NEFT', options: [['Direct Bank NEFT', 'Bank transfer (NEFT / IMPS)', 'बैंक ट्रांसफर (NEFT/IMPS)'], ['UPI', 'UPI', 'UPI'], ['Cash', 'Cash', 'नकद']] },
    { name: 'remarks', label: ['Remarks / reference', 'कमिशन संदर्भ'], full: true },
  ]

  return (
    <>
      <PageHeader eyebrow={L(['Agents', 'एजेंट'])} title={L(['Agent Commission Payment', 'एजेंट कमिशन का भुगतान'])} desc={L(['Disburse commission on verified applications.', 'सत्यापित आवेदनों पर एजेंट कमिशन संवितरण।'])}
        actions={<><Button variant="ghost" icon={<Pencil size={16} />} onClick={() => setEditing(true)}>{t('editRates')}</Button>
          <Button icon={<Wallet size={18} />} onClick={() => setPaying(true)}>{L(['Pay commission', 'कमिशन भुगतान करें'])}</Button></>} />

      <div className="mb-5.5 grid gap-4 sm:grid-cols-3">
        <StatCard label={t('commGenerated')} value={inr(totals.e)} icon={<TrendingUp size={20} />} />
        <StatCard label={t('commPaid')} value={inr(totals.p)} icon={<Check size={20} />} tone="green" />
        <StatCard label={t('commPending')} value={inr(totals.d)} icon={<Clock size={20} />} tone="amber" />
      </div>

      {COMMISSION_COLLS.every((c) => !num(rates[c])) && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3.5 text-[13.5px] text-brand-800">
          <span>{t('ratesText')}</span><Button size="sm" variant="soft" onClick={() => setEditing(true)}>{t('editRates')}</Button>
        </div>
      )}

      <div className="card mb-5.5 overflow-hidden">
        <DataTable<CRow> rows={list} columns={columns} searchText={(r) => `${r.id} ${r.name} ${r.district}`} csvName="agent-commission" emptyIcon={<Users size={34} />} emptyTitle={t('emptyTitle')} emptyText={t('noAgents')} />
      </div>

      {payouts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 pt-4.5"><h3 className="text-base font-bold">{L(['Payout history', 'भुगतान इतिहास'])}</h3></div>
          <DataTable rows={payouts as Array<{ id: string; [k: string]: unknown }>} searchText={(r) => Object.values(r).join(' ')} emptyTitle="" emptyText=""
            columns={[
              { key: 'id', header: 'ID', render: (r) => idc(r.id) },
              { key: 'a', header: L(['Agent', 'एजेंट']), render: (r) => main(String(r.agentName), String(r.agentId)) },
              { key: 'd', header: t('date'), render: (r) => fmtDate(r.date, lang) },
              { key: 'm', header: t('mode'), render: (r) => main(String(r.paymentMode), String(r.remarks || '')) },
              { key: 'am', header: t('amount'), align: 'right', render: (r) => amt(num(r.amount)) },
            ]} />
        </div>
      )}

      {paying && <FormModal title={L(['Pay agent commission', 'एजेंट कमिशन का भुगतान करे'])} fields={payFields} size="md" onClose={() => setPaying(false)}
        extraValidate={(v) => { const a = list.find((x) => x.id === v.agentId); return a && num(v.amount) > a.c.pending ? { amount: t('payoutExceeds') } : {} }}
        onSubmit={(v) => { const a = list.find((x) => x.id === v.agentId)!; add('payouts', 'PAY', { agentId: a.id, agentName: a.name, amount: num(v.amount), date: v.date, paymentMode: v.paymentMode, remarks: v.remarks }); toast(t('saved')) }} />}

      {editing && <FormModal title={t('rates')} subtitle={t('ratesText')} size="md" onClose={() => setEditing(false)}
        fields={COMMISSION_COLLS.map((c): FieldDef => ({ name: c, label: MODULE_BY_COLL[c]!.title, type: 'number', def: num(rates[c]) }))} submitLabel={t('saveRates')}
        onSubmit={(v) => { setRates(Object.fromEntries(COMMISSION_COLLS.map((c) => [c, num(v[c])]))); toast(t('saved')) }} />}
    </>
  )
}

/* ---------------- Reports ---------------- */
export function CommissionReportPage() {
  const { t, L } = useLang()
  const list = useCommissionRows()
  const columns: Column<CRow>[] = [
    { key: 'id', header: L(['Agent ID', 'एजेंट आईडी']), render: (r) => idc(r.id), csv: (r) => r.id },
    { key: 'n', header: L(['Name & contact', 'नाम व संपर्क']), render: (r) => main(r.name, r.mobile), csv: (r) => r.name },
    { key: 'a', header: L(['Applications', 'जमा किए गए आवेदन']), render: (r) => r.c.total, csv: (r) => r.c.total },
    { key: 'e', header: L(['Total commission', 'कुल कमिशन']), render: (r) => amt(r.c.earned), csv: (r) => r.c.earned },
    { key: 'p', header: L(['Paid', 'भुगतान की गई राशि']), render: (r) => amt(r.c.paid), csv: (r) => r.c.paid },
    { key: 'd', header: L(['Balance', 'शेष राशि']), render: (r) => amt(r.c.pending, r.c.pending ? 'text-warn' : ''), csv: (r) => r.c.pending },
    { key: 's', header: L(['Status', 'स्थिति']), render: (r) => <StatusBadge status={r.status} />, csv: (r) => r.status },
  ]
  return (
    <>
      <PageHeader eyebrow={L(['Reports', 'रिपोर्ट'])} title={L(['Agent Commission Report', 'एजेंट कमिशन रिपोर्ट'])} desc={L(['Commission earned and paid for every agent.', 'समस्त एजेंटों की कमिशन अर्जन व भुगतान विवरणी।'])}
        actions={<Button variant="ghost" icon={<Printer size={16} />} onClick={() => window.print()}>{t('printReport')}</Button>} />
      <div id="print-area" className="card overflow-hidden">
        <DataTable<CRow> rows={list} columns={columns} searchText={(r) => `${r.id} ${r.name}`} csvName="commission-report" emptyIcon={<Users size={34} />} emptyTitle={t('emptyTitle')} emptyText={t('noAgents')} />
      </div>
    </>
  )
}

export function AgentWiseReportPage() {
  const { t, L } = useLang()
  const list = useCommissionRows()
  const group = (r: CRow, colls: string[]) => colls.reduce((s, c) => s + (r.c.entries[c] || 0), 0)
  const columns: Column<CRow>[] = [
    { key: 'id', header: L(['Agent ID', 'एजेंट आईडी']), render: (r) => idc(r.id), csv: (r) => r.id },
    { key: 'n', header: L(['Agent', 'एजेंट विवरण']), render: (r) => main(r.name, r.mobile), csv: (r) => r.name },
    { key: 'j', header: L(['Jurisdiction', 'कार्यक्षेत्र']), render: (r) => `${r.district} – ${r.block}` },
    { key: 'b', header: L(['Marriage | Mayra | Bima | Other', 'विवाह | मायरा | बीमा | अन्य']),
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {[[group(r, ['marriage', 'bulkMarriage']), 'bg-brand-50 text-brand-700'], [group(r, ['mayra', 'bulkMayra']), 'bg-warn-bg text-warn'], [group(r, ['bima', 'bulkBima']), 'bg-ok-bg text-ok'], [group(r, ['sewing', 'cycle', 'loan']), 'bg-[#eef1f7] text-ink-500']].map(([n, cls], i) => (
            <span key={i} className={`min-w-8 rounded-lg px-2 py-1 text-center text-xs font-bold tabular-nums ${cls}`}>{n as number}</span>))}
        </div>),
      csv: (r) => `${group(r, ['marriage', 'bulkMarriage'])}|${group(r, ['mayra', 'bulkMayra'])}|${group(r, ['bima', 'bulkBima'])}|${group(r, ['sewing', 'cycle', 'loan'])}` },
    { key: 't', header: L(['Total entries', 'कुल प्रविष्टियां']), render: (r) => <b>{r.c.total}</b>, csv: (r) => r.c.total },
    { key: 'e', header: L(['Commission', 'अर्जित कमिशन']), render: (r) => amt(r.c.earned), csv: (r) => r.c.earned },
    { key: 's', header: L(['Status', 'स्थिति']), render: (r) => <StatusBadge status={r.status} />, csv: (r) => r.status },
  ]
  return (
    <>
      <PageHeader eyebrow={L(['Reports', 'रिपोर्ट'])} title={L(['Agent-wise Report', 'एजेंट वाइज रिपोर्ट'])} desc={L(['Scheme-wise performance of every agent.', 'प्रत्येक एजेंट की योजनावार कार्य निष्पादन रिपोर्ट।'])}
        actions={<Button variant="ghost" icon={<Printer size={16} />} onClick={() => window.print()}>{t('printReport')}</Button>} />
      <div id="print-area" className="card overflow-hidden">
        <DataTable<CRow> rows={list} columns={columns} searchText={(r) => `${r.id} ${r.name} ${r.district}`} csvName="agent-wise-report" emptyIcon={<HandCoins size={34} />} emptyTitle={t('emptyTitle')} emptyText={t('noAgents')} />
      </div>
    </>
  )
}

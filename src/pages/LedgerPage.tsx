import { useMemo } from 'react'
import { ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react'
import { buildLedger, type LedgerTxn } from '@/lib/domain'
import { useLang } from '@/lib/i18n'
import { fmtDate, inr } from '@/lib/utils'
import { useData } from '@/store/DataContext'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'

export function txnColumns(t: ReturnType<typeof useLang>['t'], L: ReturnType<typeof useLang>['L'], lang: 'en' | 'hi'): Column<LedgerTxn>[] {
  return [
    { key: 'id', header: t('txnNo'), render: (r) => <span className="whitespace-nowrap font-bold tabular-nums text-brand-700">{r.id}</span>, csv: (r) => r.id },
    { key: 'd', header: t('date'), render: (r) => fmtDate(r.date, lang), csv: (r) => r.date },
    { key: 'p', header: t('party'), render: (r) => <span className="font-semibold">{r.party || '—'}</span>, csv: (r) => r.party },
    { key: 's', header: t('scheme'), render: (r) => L(r.scheme), csv: (r) => L(r.scheme) },
    { key: 't', header: t('type'), render: (r) => <Badge tone={r.dir === 'in' ? 'ok' : 'info'}>{r.dir === 'in' ? t('dirIn') : t('dirOut')}</Badge>, csv: (r) => r.dir },
    { key: 'a', header: t('amount'), align: 'right', render: (r) => <span className={`whitespace-nowrap font-bold tabular-nums ${r.dir === 'in' ? 'text-ok' : ''}`}>{r.dir === 'in' ? '+' : '−'}{inr(r.amount)}</span>, csv: (r) => r.amount },
    { key: 'm', header: t('mode'), render: (r) => r.mode || '—', csv: (r) => r.mode },
  ]
}

export function LedgerPage() {
  const { t, L, lang } = useLang()
  const { rows, data } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ledger = useMemo(() => buildLedger((c) => rows(c)), [data])
  const inn = ledger.filter((x) => x.dir === 'in').reduce((s, x) => s + x.amount, 0)
  const out = ledger.filter((x) => x.dir === 'out').reduce((s, x) => s + x.amount, 0)
  return (
    <>
      <PageHeader eyebrow={L(['Finance', 'वित्त'])} title={L(['Payment Management', 'भुगतान प्रबंधन'])} desc={L(['The master ledger of every incoming and outgoing payment.', 'फाउंडेशन के समस्त आवक व जावक भुगतानों की मुख्य बही।'])} />
      <div className="mb-5.5 grid gap-4 sm:grid-cols-3">
        <StatCard label={t('incoming')} value={inr(inn)} icon={<ArrowDownLeft size={20} />} tone="green" />
        <StatCard label={t('outgoing')} value={inr(out)} icon={<ArrowUpRight size={20} />} />
        <StatCard label={L(['Net position', 'शुद्ध स्थिति'])} value={inr(inn - out)} icon={<Landmark size={20} />} tone="navy" />
      </div>
      <div className="card overflow-hidden">
        <DataTable<LedgerTxn> rows={ledger} columns={txnColumns(t, L, lang)} searchText={(r) => `${r.id} ${r.party} ${L(r.scheme)} ${r.mode}`}
          statuses={[{ value: 'in', label: t('dirIn') }, { value: 'out', label: t('dirOut') }]} getStatus={(r) => r.dir} csvName="ledger" pageSize={12}
          emptyIcon={<Landmark size={34} />} emptyTitle={t('emptyTitle')} emptyText={L(['Payments, collections and commission payouts appear here automatically.', 'भुगतान, संकलन और कमिशन भुगतान यहाँ स्वतः दिखेंगे।'])} />
      </div>
    </>
  )
}

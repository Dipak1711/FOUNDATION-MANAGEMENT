import type { Pair, Status } from '@/types'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'
const TONE: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok', warn: 'bg-warn-bg text-warn', bad: 'bg-bad-bg text-bad',
  info: 'bg-brand-50 text-brand-700', neutral: 'bg-[#eef1f7] text-ink-500',
}
const STATUS: Record<Status, [Tone, Pair]> = {
  Approved: ['ok', ['Approved', 'स्वीकृत']], Distributed: ['ok', ['Distributed', 'वितरित']], Paid: ['ok', ['Paid', 'भुगतान पूर्ण']],
  Active: ['ok', ['Active', 'सक्रिय']], Deposited: ['ok', ['Deposited', 'जमा']],
  Pending: ['warn', ['Pending', 'लंबित']], Rejected: ['bad', ['Rejected', 'अस्वीकृत']], Suspended: ['bad', ['Suspended', 'निलंबित']],
  Inactive: ['neutral', ['Inactive', 'निष्क्रिय']],
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold', TONE[tone], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status?: string }) {
  const { L } = useLang()
  if (!status) return <Badge>—</Badge>
  const s = STATUS[status as Status]
  return <Badge tone={s?.[0] ?? 'neutral'}>{s ? L(s[1]) : status}</Badge>
}

export const statusLabel = (status: string, L: (p: Pair) => string) => (STATUS[status as Status] ? L(STATUS[status as Status][1]) : status)

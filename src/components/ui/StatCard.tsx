import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './AnimatedNumber'
import { Sparkline, type SparkTone } from './Sparkline'

type Tone = 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'navy'
const TONES: Record<Tone, { card: string; icon: string }> = {
  blue: { card: 'from-brand-50 via-white to-white', icon: 'bg-brand-100 text-brand-600' },
  green: { card: 'from-ok-bg/70 via-white to-white', icon: 'bg-ok-bg text-ok' },
  amber: { card: 'from-warn-bg/70 via-white to-white', icon: 'bg-warn-bg text-warn' },
  rose: { card: 'from-bad-bg/70 via-white to-white', icon: 'bg-bad-bg text-bad' },
  violet: { card: 'from-violet-50 via-white to-white', icon: 'bg-violet-100 text-violet-600' },
  navy: { card: 'from-brand-100/70 via-white to-white', icon: 'bg-linear-to-br from-brand-600 to-brand-900 text-white' },
}

interface Props {
  label: string
  /** Plain content; ignored when `numeric` is given. */
  value?: ReactNode
  numeric?: number
  format?: (v: number) => string
  icon: ReactNode
  tone?: Tone
  hint?: ReactNode
  trend?: { text: string; good: boolean }
  spark?: number[]
}

export function StatCard({ label, value, numeric, format, icon, tone = 'blue', hint, trend, spark }: Props) {
  const t = TONES[tone]
  return (
    <div className={cn('card group relative overflow-hidden bg-linear-to-br p-5 transition duration-300 hover:-translate-y-0.75 hover:shadow-lift', t.card)}>
      <div className="flex items-start gap-3.5">
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-[14px] transition group-hover:scale-105', t.icon)}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[28px] font-extrabold leading-none tracking-tight">
            {numeric !== undefined ? <AnimatedNumber value={numeric} format={format} /> : value}
          </div>
          <div className="mt-1.5 text-[13px] font-semibold text-ink-700">{label}</div>
        </div>
        {trend && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums', trend.good ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad')}>{trend.text}</span>
        )}
      </div>
      {spark && <div className="mt-3.5"><Sparkline data={spark} tone={tone as SparkTone} /></div>}
      {hint && <div className="mt-2.5 text-xs text-ink-500">{hint}</div>}
    </div>
  )
}

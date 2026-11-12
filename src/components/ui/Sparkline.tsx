import { useId } from 'react'

export type SparkTone = 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'navy'
const STROKE: Record<SparkTone, string> = { blue: '#2f6bff', green: '#0f9d6b', amber: '#d98a00', rose: '#d6384f', violet: '#7c5cff', navy: '#0f2f8f' }

/** A quiet trend line: no axes or labels — just "which way is this going". */
export function Sparkline({ data, tone = 'blue', height = 30 }: { data: number[]; tone?: SparkTone; height?: number }) {
  const gid = useId()
  if (!data || data.length < 2) return <div style={{ height }} />
  const w = 100, pad = 3
  const max = Math.max(...data), min = Math.min(...data), span = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, pad + (1 - (v - min) / span) * (height - pad * 2)] as const)
  const line = pts.map(([x, y], i) => {
    if (!i) return `M${x.toFixed(2)},${y.toFixed(2)}`
    const [px, py] = pts[i - 1], cx = (px + x) / 2
    return `C${cx.toFixed(2)},${py.toFixed(2)} ${cx.toFixed(2)},${y.toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" height={height} className="w-full overflow-visible" aria-hidden focusable="false">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={STROKE[tone]} stopOpacity="0.22" /><stop offset="100%" stopColor={STROKE[tone]} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={STROKE[tone]} strokeWidth="1.75" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

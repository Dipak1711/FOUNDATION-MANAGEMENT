import type { Lang, Pair, Status } from '@/types'

export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ')

export const num = (v: unknown) => Number(v) || 0
export const inr = (v: unknown) => '₹' + num(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })
export const today = () => new Date().toISOString().slice(0, 10)

export function fmtDate(d: unknown, lang: Lang = 'en') {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const initials = (n: string) =>
  n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'FM'

export const pick = (p: Pair | string, lang: Lang) => (typeof p === 'string' ? p : lang === 'hi' ? p[1] || p[0] : p[0])

export const DONE: Status[] = ['Approved', 'Distributed', 'Paid', 'Deposited']
export const isDone = (s?: string) => DONE.includes(s as Status)

/** Non-cryptographic placeholder hash — authentication must move server-side. */
export function hashPw(s: string) {
  let a = 0x811c9dc5, b = 0x1000193
  for (let i = 0; i < s.length; i++) {
    a = Math.imul(a ^ s.charCodeAt(i), 16777619)
    b = Math.imul(b + s.charCodeAt(i), 2246822519) ^ a
  }
  return ((a >>> 0).toString(16) + (b >>> 0).toString(16)).padStart(16, '0')
}

export function downloadCsv(name: string, headers: string[], rows: unknown[][]) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '﻿' + [headers, ...rows].map((r) => r.map(q).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name + '.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

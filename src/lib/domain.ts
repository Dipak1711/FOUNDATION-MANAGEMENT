import type { Agent, BaseRecord, CollectionName, Pair, Txn } from '@/types'
import { COMMISSION_COLLS, MODULES } from '@/config/modules'
import { isDone, num } from '@/lib/utils'

type Rows = (c: CollectionName) => BaseRecord[]
type Rates = Partial<Record<CollectionName, number>>

export interface Commission { earned: number; paid: number; pending: number; entries: Record<string, number>; total: number }

/** Commission earned = Σ (completed records attributed to the agent × flat rate of that scheme). */
export function commissionFor(agentId: string, rows: Rows, rates: Rates): Commission {
  let earned = 0, total = 0
  const entries: Record<string, number> = {}
  for (const c of COMMISSION_COLLS) {
    const mine = rows(c).filter((r) => r.agentId === agentId)
    entries[c] = mine.length
    total += mine.length
    earned += mine.filter((r) => isDone(r.status)).length * num(rates[c])
  }
  const paid = rows('payouts').filter((p) => p.agentId === agentId).reduce((s, p) => s + num(p.amount), 0)
  return { earned, paid, pending: Math.max(0, earned - paid), entries, total }
}

export interface LedgerTxn extends Txn { collection: CollectionName }

/** Single-source ledger derived from every payment / collection record. */
export function buildLedger(rows: Rows): LedgerTxn[] {
  const out: LedgerTxn[] = []
  for (const m of MODULES) {
    if (!m.txn) continue
    for (const r of rows(m.coll)) {
      const t = m.txn(r as never)
      out.push({ id: r.id, date: String(r.date || r.collectionDate || r.createdAt), scheme: m.short, collection: m.coll, ...t })
    }
  }
  const emi: Pair = ['Loan EMI', 'ऋण ईएमआई']
  for (const e of rows('loanEmi')) {
    out.push({ id: e.id, date: String(e.date || e.createdAt), scheme: emi, collection: 'loanEmi', dir: 'in', party: String(e.borrower ?? ''), amount: num(e.amount), mode: String(e.paymentMode ?? '') })
  }
  const comm: Pair = ['Agent commission', 'एजेंट कमिशन']
  for (const p of rows('payouts')) {
    out.push({ id: p.id, date: String(p.date || p.createdAt), scheme: comm, collection: 'payouts', dir: 'out', party: String(p.agentName ?? ''), amount: num(p.amount), mode: String(p.paymentMode ?? '') })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)))
}

export const agentNameOf = (agents: Agent[], id?: string) => (id ? agents.find((a) => a.id === id)?.name ?? id : '—')

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BaseRecord, CollectionName } from '@/types'
import { buildSeed } from '@/lib/seed'

/**
 * Data layer. The surface (`add / update / remove / data`) is collection-based so the
 * localStorage adapter below can be swapped for REST calls without touching any page.
 * First run loads the demo dataset from lib/seed.ts (swap for an empty `DB` in production).
 */
const KEY = 'fm_db_v3'

interface DB {
  c: Partial<Record<CollectionName, BaseRecord[]>>
  seq: Partial<Record<CollectionName, number>>
  rates: Partial<Record<CollectionName, number>>
  admin: { username: string; name: string; hash: string }
}

const fresh = (): DB => buildSeed() as DB

function load(): DB {
  // `?reset` in the URL restores the demo dataset.
  if (new URLSearchParams(location.search).has('reset')) {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    history.replaceState(null, '', location.pathname)
  }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (raw?.c) return raw as DB
  } catch { /* corrupt or unavailable */ }
  return fresh()
}

interface DataCtx {
  data: Partial<Record<CollectionName, BaseRecord[]>>
  rates: DB['rates']
  admin: DB['admin']
  rows: <T extends BaseRecord = BaseRecord>(c: CollectionName) => T[]
  add: <T extends BaseRecord = BaseRecord>(c: CollectionName, prefix: string, d: Record<string, unknown>) => T
  update: (c: CollectionName, id: string, patch: Record<string, unknown>) => void
  remove: (c: CollectionName, id: string) => void
  setRates: (r: DB['rates']) => void
}

const Ctx = createContext<DataCtx | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const ref = useRef(db)
  ref.current = db

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* storage unavailable */ }
  }, [db])

  const add = useCallback<DataCtx['add']>((c, prefix, d) => {
    const n = (ref.current.seq[c] || 0) + 1
    const rec = { id: `${prefix}-${1000 + n}`, createdAt: new Date().toISOString(), ...d } as BaseRecord
    // Update the ref synchronously so back-to-back adds never reuse an id.
    const next: DB = { ...ref.current, seq: { ...ref.current.seq, [c]: n }, c: { ...ref.current.c, [c]: [...(ref.current.c[c] || []), rec] } }
    ref.current = next
    setDb(next)
    return rec as never
  }, [])

  const update = useCallback<DataCtx['update']>((c, id, patch) => {
    const next: DB = { ...ref.current, c: { ...ref.current.c, [c]: (ref.current.c[c] || []).map((r) => (r.id === id ? { ...r, ...patch } : r)) } }
    ref.current = next
    setDb(next)
  }, [])

  const remove = useCallback<DataCtx['remove']>((c, id) => {
    const next: DB = { ...ref.current, c: { ...ref.current.c, [c]: (ref.current.c[c] || []).filter((r) => r.id !== id) } }
    ref.current = next
    setDb(next)
  }, [])

  const setRates = useCallback((rates: DB['rates']) => {
    const next = { ...ref.current, rates }
    ref.current = next
    setDb(next)
  }, [])

  const value = useMemo<DataCtx>(() => ({
    data: db.c, rates: db.rates, admin: db.admin,
    rows: (c) => (db.c[c] || []) as never,
    add, update, remove, setRates,
  }), [db, add, update, remove, setRates])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useData must be used inside DataProvider')
  return c
}

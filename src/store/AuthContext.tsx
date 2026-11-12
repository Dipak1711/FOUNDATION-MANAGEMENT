import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Agent, Role, SessionUser } from '@/types'
import { hashPw } from '@/lib/utils'
import { useData } from './DataContext'

const KEY = 'fm_session_v2'

type LoginResult = { ok: true } | { ok: false; reason: 'bad' | 'blocked' }

interface AuthCtx {
  user: SessionUser | null
  isAdmin: boolean
  login: (username: string, password: string, role: Role, remember: boolean) => LoginResult
  logout: () => void
}
const Ctx = createContext<AuthCtx | null>(null)

function readSession(): SessionUser | null {
  try { return JSON.parse(localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || 'null') } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { admin, rows } = useData()
  const [user, setUser] = useState<SessionUser | null>(readSession)

  const login = useCallback<AuthCtx['login']>((username, password, role, remember) => {
    const h = hashPw(password)
    const u = username.trim()
    let found: SessionUser | null = null

    if (role === 'admin') {
      if (admin.username === u.toLowerCase() && admin.hash === h) found = { id: 'admin', role, name: admin.name }
    } else {
      const ag = rows<Agent>('agents').find((a) => a.mobile === u || a.id.toLowerCase() === u.toLowerCase())
      if (ag && ag.hash === h) {
        if (ag.status !== 'Active') return { ok: false, reason: 'blocked' }
        found = { id: ag.id, role, name: ag.name }
      }
    }
    if (!found) return { ok: false, reason: 'bad' }
    try { (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(found)) } catch { /* ignore */ }
    setUser(found)
    return { ok: true }
  }, [admin, rows])

  const logout = useCallback(() => {
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) } catch { /* ignore */ }
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, isAdmin: user?.role === 'admin', login, logout }), [user, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}

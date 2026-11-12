import { BookOpenCheck, FileBarChart, Heart, KeyRound, Landmark, LayoutDashboard, Layers, UserPlus, Users, Wallet, type LucideIcon } from 'lucide-react'
import type { Pair } from '@/types'
import type { UIKey } from '@/lib/i18n'
import { MODULES, type Group } from '@/config/modules'

export interface NavItem { to: string; icon: LucideIcon; title: Pair }
export interface NavGroup {
  id: string
  key: UIKey
  icon: LucideIcon
  /** Tailwind classes for the little icon tile of each item in the group. */
  tone: string
  items: NavItem[]
}

const modItems = (g: Group): NavItem[] => MODULES.filter((m) => m.group === g).map((m) => ({ to: '/' + m.id, icon: m.icon, title: m.title }))

export const NAV: NavGroup[] = [
  { id: 'main', key: 'grpMain', icon: LayoutDashboard, tone: 'bg-brand-50 text-brand-600', items: [{ to: '/', icon: LayoutDashboard, title: ['Dashboard', 'डैशबोर्ड'] }] },
  { id: 'schemes', key: 'grpSchemes', icon: Heart, tone: 'bg-brand-50 text-brand-600', items: modItems('schemes') },
  {
    id: 'agents', key: 'grpAgents', icon: Users, tone: 'bg-violet-50 text-violet-600',
    items: [
      { to: '/agent-reg', icon: UserPlus, title: ['Agent Registration', 'एजेंट आवेदन'] },
      { to: '/agent-perm', icon: KeyRound, title: ['Agent Permissions', 'एजेंट की अनुमति'] },
      { to: '/agent-pay', icon: Wallet, title: ['Commission Payment', 'एजेंट कमिशन भुगतान'] },
      { to: '/agent-comm-rep', icon: FileBarChart, title: ['Commission Report', 'एजेंट कमिशन रिपोर्ट'] },
      { to: '/agent-wise-rep', icon: BookOpenCheck, title: ['Agent-wise Report', 'एजेंट वाइज रिपोर्ट'] },
    ],
  },
  { id: 'bulk', key: 'grpBulk', icon: Layers, tone: 'bg-sky-50 text-sky-600', items: modItems('bulk') },
  { id: 'finance', key: 'grpFinance', icon: Landmark, tone: 'bg-emerald-50 text-emerald-600', items: [{ to: '/payment-mgmt', icon: Landmark, title: ['Payment Management', 'भुगतान प्रबंधन'] }] },
]

/** Routes an agent account may open (their own applications and collections). */
export const AGENT_ROUTES = new Set(['/', ...MODULES.filter((m) => m.agentLinked).map((m) => '/' + m.id)])

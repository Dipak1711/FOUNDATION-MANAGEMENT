import { lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useLang } from '@/lib/i18n'
import { LoginPage } from '@/pages/LoginPage'
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
import { ModulePage } from '@/pages/ModulePage'
import { AgentPayPage, AgentPermPage, AgentRegPage, AgentWiseReportPage, CommissionReportPage } from '@/pages/AgentPages'
import { LedgerPage } from '@/pages/LedgerPage'
import { MODULES } from '@/config/modules'

function NotFound() {
  const { t } = useLang()
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div><div className="text-7xl font-extrabold text-brand-200">404</div><h2 className="mb-5 mt-2 text-xl font-bold">{t('notFound')}</h2>
        <Link to="/"><Button>{t('backHome')}</Button></Link></div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {MODULES.map((m) => <Route key={m.id} path={m.id} element={<ModulePage />} />)}
        <Route path="agent-reg" element={<AgentRegPage />} />
        <Route path="agent-perm" element={<AgentPermPage />} />
        <Route path="agent-pay" element={<AgentPayPage />} />
        <Route path="agent-comm-rep" element={<CommissionReportPage />} />
        <Route path="agent-wise-rep" element={<AgentWiseReportPage />} />
        <Route path="payment-mgmt" element={<LedgerPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

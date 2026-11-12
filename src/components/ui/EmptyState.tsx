import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4.5 grid h-19 w-19 place-items-center rounded-3xl bg-linear-to-br from-brand-50 to-brand-100 text-brand-500">
        {icon ?? <Inbox size={34} />}
      </div>
      <h4 className="text-[17px] font-bold">{title}</h4>
      <p className="mx-auto mb-5 mt-1.5 max-w-sm text-ink-500">{text}</p>
      {action}
    </div>
  )
}

import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, desc, actions, icon }: { eyebrow?: string; title: string; desc?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
      <div className="flex min-w-0 flex-[1_1_340px] items-start gap-4">
        {icon && <span className="mt-1 hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-700 text-white shadow-[0_10px_24px_-8px_rgba(29,78,216,0.6)] ring-1 ring-inset ring-white/40 sm:grid">{icon}</span>}
        <div>
          {eyebrow && (
            <div className="mb-1.5 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-ink-500">
              <span className="h-0.75 w-7 rounded-full bg-linear-to-r from-brand-400 to-brand-600" />{eyebrow}
            </div>
          )}
          <h2 className="text-[24px] font-extrabold tracking-tight sm:text-[30px]">{title}</h2>
          {desc && <p className="mt-1 max-w-xl text-ink-500">{desc}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  )
}

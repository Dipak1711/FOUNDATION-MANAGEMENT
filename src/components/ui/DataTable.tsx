import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Download, Plus, Search } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { cn, downloadCsv } from '@/lib/utils'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'right'
  /** Plain-text value used for CSV export. */
  csv?: (row: T) => unknown
}

interface Props<T extends { id: string }> {
  rows: T[]
  columns: Column<T>[]
  searchText: (row: T) => string
  /** Optional status filter chips. */
  statuses?: Array<{ value: string; label: string }>
  getStatus?: (row: T) => string | undefined
  actions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  emptyTitle: string
  emptyText: string
  emptyIcon?: ReactNode
  onAdd?: () => void
  addLabel?: string
  csvName?: string
  pageSize?: number
}

export function DataTable<T extends { id: string }>({
  rows, columns, searchText, statuses, getStatus, actions, onRowClick,
  emptyTitle, emptyText, emptyIcon, onAdd, addLabel, csvName, pageSize = 10,
}: Props<T>) {
  const { t } = useLang()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => (status === 'all' || getStatus?.(r) === status) && (!needle || searchText(r).toLowerCase().includes(needle)))
  }, [rows, q, status, getStatus, searchText])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const cur = Math.min(page, pages)
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize)
  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    rows.forEach((r) => { const s = getStatus?.(r); if (s) m[s] = (m[s] || 0) + 1 })
    return m
  }, [rows, getStatus])

  const exportCsv = () => {
    downloadCsv(csvName || 'export', columns.map((c) => c.header), filtered.map((r) => columns.map((c) => c.csv?.(r) ?? '')))
  }

  if (!rows.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} text={emptyText}
      action={onAdd && <Button icon={<Plus size={17} />} onClick={onAdd}>{addLabel}</Button>} />
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="relative w-full sm:max-w-85">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="control h-10 border-line bg-canvas pl-10" value={q} placeholder={t('searchTable')} aria-label={t('searchTable')}
            onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statuses && (
            <div className="flex flex-wrap gap-1.5" role="group">
              {[{ value: 'all', label: t('all') }, ...statuses].map((s) => (
                <button key={s.value} type="button" aria-pressed={status === s.value}
                  onClick={() => { setStatus(s.value); setPage(1) }}
                  className={cn('rounded-full border px-3.25 py-1.5 text-[12.5px] font-semibold transition',
                    status === s.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong bg-white text-ink-700 hover:border-brand-400')}>
                  {s.label}{s.value !== 'all' && <small className="ml-1 opacity-70">{counts[s.value] || 0}</small>}
                </button>
              ))}
            </div>
          )}
          {csvName && <Button variant="ghost" size="sm" icon={<Download size={15} />} onClick={exportCsv}>{t('exportCsv')}</Button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} text={t('emptyFiltered')} />
      ) : (
        <div className="overflow-x-auto max-sm:overflow-visible">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'text-right' : undefined}>{c.header}</th>)}
                {actions && <th className="text-right">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={onRowClick ? 'cursor-pointer' : undefined}>
                  {columns.map((c) => <td key={c.key} data-label={c.header} className={c.align === 'right' ? 'text-right' : undefined}>{c.render(r)}</td>)}
                  {actions && (
                    <td data-label={t('actions')} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">{actions(r)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line px-5 py-3.5 text-[13px] text-ink-500">
        <span>{t('showing')} {filtered.length ? (cur - 1) * pageSize + 1 : 0}–{Math.min(cur * pageSize, filtered.length)} {t('of')} {filtered.length} {t('records')}</span>
        {pages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8.5 w-8.5" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous"><ChevronLeft size={16} /></Button>
            <span className="min-w-14 text-center font-semibold text-ink-700">{cur} / {pages}</span>
            <Button variant="ghost" size="icon" className="h-8.5 w-8.5" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next"><ChevronRight size={16} /></Button>
          </div>
        )}
      </div>
    </>
  )
}

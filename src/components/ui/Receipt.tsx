import { Heart, Printer } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { inr } from '@/lib/utils'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ReceiptData {
  title: string
  no: string
  rows: Array<[string, string]>
  amount?: number
  note?: string
  signLeft?: string
}

export function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const { t } = useLang()
  return (
    <Modal
      title={data.title} size="md" onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('close')}</Button>
        <Button icon={<Printer size={17} />} onClick={() => window.print()}>{t('print')}</Button>
      </>}
    >
      <div id="print-area">
        <div className="rounded-2xl border-2 border-brand-700 bg-white p-6 sm:p-7">
          <div className="mb-4.5 border-b-2 border-brand-100 pb-4 text-center">
            <div className="mx-auto mb-2.5 grid h-11.5 w-11.5 place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-600 text-white"><Heart size={22} /></div>
            <h4 className="text-[18px] font-extrabold tracking-wider text-brand-800">FOUNDATION MANAGEMENT</h4>
            <small className="text-ink-500">Purbiya Balika Foundation (Regd.)</small>
          </div>
          <div className="mb-4.5 text-center text-[20px] font-extrabold text-brand-700">{data.title}</div>
          <dl>
            {[[t("receiptNo"), data.no] as [string, string], ...data.rows, [t('printed'), new Date().toLocaleDateString('en-IN')] as [string, string]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4.5 border-b border-dashed border-line-strong py-3">
                <dt className="text-[13px] font-semibold text-ink-500">{k}</dt>
                <dd className="text-right font-semibold break-words">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          {data.amount != null && <div className="my-4.5 text-center text-3xl font-extrabold text-brand-800">{inr(data.amount)}</div>}
          {data.note && <p className="my-4.5 text-center leading-8 text-ink-700">{data.note}</p>}
          <div className="mt-11 flex justify-between text-[12.5px] text-ink-500">
            <span className="min-w-36 border-t border-ink-400 pt-1.5 text-center">{data.signLeft ?? t('recvSign')}</span>
            <span className="min-w-36 border-t border-ink-400 pt-1.5 text-center">{t('authSign')}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

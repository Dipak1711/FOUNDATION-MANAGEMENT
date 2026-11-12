import type { ReactNode } from 'react'
import { LogOut, Trash2 } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { Button } from './Button'
import { Modal } from './Modal'

interface Props {
  title: string
  text: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
  icon?: ReactNode
}

export function ConfirmDialog({ title, text, confirmLabel, tone = 'danger', onConfirm, onClose, icon }: Props) {
  const { t } = useLang()
  return (
    <Modal
      title={title} size="sm" onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel ?? t('delete')}</Button>
      </>}
    >
      <div className={`mb-3.5 grid h-13.5 w-13.5 place-items-center rounded-2xl ${tone === 'danger' ? 'bg-bad-bg text-bad' : 'bg-brand-50 text-brand-600'}`}>
        {icon ?? (tone === 'danger' ? <Trash2 size={22} /> : <LogOut size={22} />)}
      </div>
      <p className="text-ink-500">{text}</p>
    </Modal>
  )
}

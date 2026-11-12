import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="inline-flex rounded-[11px] bg-[#eaf0fc] p-0.75" role="group" aria-label="Language">
      {([['hi', 'हिंदी'], ['en', 'English']] as const).map(([k, label]) => (
        <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)}
          className={cn('rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition', lang === k ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-900')}>{label}</button>
      ))}
    </div>
  )
}

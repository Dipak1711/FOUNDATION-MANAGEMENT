import { Fragment, useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { FieldDef, Validator } from '@/types'
import { useLang, type UIKey } from '@/lib/i18n'
import { Button } from './Button'
import { Modal } from './Modal'

type Values = Record<string, string>
type Errors = Record<string, string>

const CHECKS: Record<Validator, [(v: string) => boolean, UIKey]> = {
  mobile: [(v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')), 'invalidMobile'],
  aadhaar: [(v) => /^\d{12}$/.test(v.replace(/\s/g, '')), 'invalidAadhaar'],
  email: [(v) => /^\S+@\S+\.\S+$/.test(v), 'invalidEmail'],
  ifsc: [(v) => /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(v), 'invalidIfsc'],
  amount: [(v) => Number(v) > 0, 'invalidAmount'],
}

export function initialValues(fields: FieldDef[], seed: Values = {}): Values {
  const out: Values = {}
  for (const f of fields) {
    const d = typeof f.def === 'function' ? f.def() : f.def
    out[f.name] = seed[f.name] ?? (d === undefined ? '' : String(d))
  }
  return out
}

export function validate(fields: FieldDef[], v: Values, t: (k: UIKey) => string): Errors {
  const e: Errors = {}
  for (const f of fields) {
    const val = (v[f.name] ?? '').trim()
    if (f.required && !val) e[f.name] = t('required')
    else if (val && f.valid) {
      const [ok, msg] = CHECKS[f.valid]
      if (!ok(val)) e[f.name] = t(msg)
    }
  }
  return e
}

interface FieldsProps { fields: FieldDef[]; values: Values; errors: Errors; onChange: (name: string, v: string) => void }

export function FormFields({ fields, values, errors, onChange }: FieldsProps) {
  const { L } = useLang()
  const uid = useId()
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-4.5 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `${uid}-${f.name}`
        const err = errors[f.name]
        const common = {
          id, name: f.name, value: values[f.name] ?? '', className: 'control',
          'aria-invalid': err ? true : undefined, 'aria-describedby': err ? id + '-e' : undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(f.name, e.target.value),
        } as const
        let control: ReactNode
        if (f.type === 'select') {
          control = (
            <select {...common}>
              <option value="">—</option>
              {f.options?.map((o) => <option key={o[0]} value={o[0]}>{L([o[1], o[2]])}</option>)}
            </select>
          )
        } else if (f.type === 'textarea') {
          control = <textarea {...common} placeholder={f.ph ? L(f.ph) : undefined} />
        } else {
          control = (
            <input
              {...common}
              type={f.type ?? 'text'}
              placeholder={f.ph ? L(f.ph) : undefined}
              inputMode={f.type === 'tel' || f.valid === 'aadhaar' ? 'numeric' : f.type === 'number' ? 'decimal' : undefined}
              maxLength={f.type === 'tel' ? 10 : f.valid === 'aadhaar' ? 14 : undefined}
              min={f.type === 'number' ? 0 : undefined}
              autoComplete={f.type === 'password' ? 'new-password' : 'off'}
            />
          )
        }
        return (
          <Fragment key={f.name}>
            {f.section && (
              <div className="mt-1.5 flex items-center gap-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-brand-600 sm:col-span-2">
                {L(f.section)}<span className="h-px flex-1 bg-line" />
              </div>
            )}
            <div className={cn('flex min-w-0 flex-col gap-1.5', f.full && 'sm:col-span-2')}>
              <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-700">
                {L(f.label)}{f.required && <span className="ml-0.5 text-bad">*</span>}
              </label>
              {control}
              {f.hint && !err && <span className="text-xs text-ink-400">{L(f.hint)}</span>}
              {err && <span id={id + '-e'} role="alert" className="text-xs text-bad">{err}</span>}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

interface FormModalProps {
  title: string
  subtitle?: string
  fields: FieldDef[]
  seed?: Values
  submitLabel?: string
  size?: 'sm' | 'md' | 'lg'
  /** Return an error message string to keep the dialog open and show it as a field error / toast. */
  onSubmit: (v: Values) => string | void | Promise<string | void>
  onClose: () => void
  /** Extra validation that needs outside context. Return field errors. */
  extraValidate?: (v: Values) => Record<string, string | undefined>
}

export function FormModal({ title, subtitle, fields, seed, submitLabel, size = 'lg', onSubmit, onClose, extraValidate }: FormModalProps) {
  const { t } = useLang()
  const [values, setValues] = useState<Values>(() => initialValues(fields, seed))
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const e: Errors = { ...validate(fields, values, t) }
    for (const [k, m] of Object.entries(extraValidate?.(values) ?? {})) if (m) e[k] = m
    setErrors(e)
    if (Object.keys(e).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setBusy(true)
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))
    const res = await onSubmit(trimmed)
    setBusy(false)
    if (typeof res === 'string') setErrors({ _form: res })
    else onClose()
  }

  return (
    <Modal
      title={title} subtitle={subtitle} size={size} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
        <Button loading={busy} icon={<Check size={17} />} onClick={submit}>{submitLabel ?? t('save')}</Button>
      </>}
    >
      <form noValidate onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <FormFields fields={fields} values={values} errors={errors}
          onChange={(n, v) => { setValues((s) => ({ ...s, [n]: v })); if (errors[n] || errors._form) setErrors(({ [n]: _a, _form: _b, ...rest }) => rest) }} />
        {errors._form && <p role="alert" className="mt-4 rounded-xl bg-bad-bg px-3.5 py-2.5 text-[13px] font-semibold text-bad">{errors._form}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

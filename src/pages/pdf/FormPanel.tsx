import { useEffect, useState } from 'react'
import { inputCls } from '../../components/ui'
import { t } from '../../utils/i18n'

type FieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'optionlist'

interface FieldDesc {
  name: string
  type: FieldType
  options: string[]
  initial: string
}

interface Props {
  file: File | null
  formValues: Record<string, string>
  onChange: (name: string, value: string) => void
}

export default function FormPanel({ file, formValues, onChange }: Props) {
  const [fields, setFields] = useState<FieldDesc[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!file) return
    let cancelled = false
    setFields(null)
    setFailed(false)
    void (async () => {
      try {
        const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } =
          await import('pdf-lib')
        const doc = await PDFDocument.load(await file.arrayBuffer())
        const descs: FieldDesc[] = []
        for (const field of doc.getForm().getFields()) {
          const name = field.getName()
          if (field instanceof PDFTextField) {
            descs.push({ name, type: 'text', options: [], initial: field.getText() ?? '' })
          } else if (field instanceof PDFCheckBox) {
            descs.push({ name, type: 'checkbox', options: [], initial: String(field.isChecked()) })
          } else if (field instanceof PDFRadioGroup) {
            descs.push({ name, type: 'radio', options: field.getOptions(), initial: field.getSelected() ?? '' })
          } else if (field instanceof PDFDropdown) {
            descs.push({ name, type: 'dropdown', options: field.getOptions(), initial: field.getSelected()?.[0] ?? '' })
          } else if (field instanceof PDFOptionList) {
            descs.push({ name, type: 'optionlist', options: field.getOptions(), initial: field.getSelected()?.[0] ?? '' })
          }
        }
        if (!cancelled) setFields(descs)
      } catch {
        if (!cancelled) {
          setFields([])
          setFailed(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file])

  if (fields === null) return null
  if (failed) {
    return (
      <p className="text-xs text-slate-500">{t('Could not read this PDF’s form fields.')}</p>
    )
  }
  if (fields.length === 0) {
    return <p className="text-xs text-slate-500">{t('No fillable fields in this PDF.')}</p>
  }

  const value = (f: FieldDesc) => formValues[f.name] ?? f.initial

  return (
    <details className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5">
      <summary className="cursor-pointer text-xs font-medium text-slate-500">
        {t('Form fields ({count})', { count: fields.length })}
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className="flex min-w-0 items-center gap-2 text-sm">
            {f.type === 'checkbox' ? (
              <>
                <input
                  type="checkbox"
                  checked={value(f) === 'true'}
                  onChange={(event) => onChange(f.name, String(event.target.checked))}
                  className="h-4 w-4 shrink-0 accent-sky-500"
                />
                <span className="truncate text-slate-700 dark:text-slate-300" title={f.name}>
                  {f.name}
                </span>
              </>
            ) : (
              <span className="flex w-full min-w-0 flex-col gap-1">
                <span className="truncate text-xs text-slate-500" title={f.name}>
                  {f.name}
                </span>
                {f.type === 'text' ? (
                  <input
                    type="text"
                    value={value(f)}
                    onChange={(event) => onChange(f.name, event.target.value)}
                    className={inputCls}
                  />
                ) : (
                  <select
                    value={value(f)}
                    onChange={(event) => onChange(f.name, event.target.value)}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </span>
            )}
          </label>
        ))}
      </div>
    </details>
  )
}

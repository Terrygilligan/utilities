import { useId, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export default function FilePicker({
  accept,
  multiple,
  onFiles,
  title,
  subtitle,
  icon: Icon,
}: {
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title: string
  subtitle?: string
  icon: LucideIcon
}) {
  const id = useId()
  const [dragActive, setDragActive] = useState(false)

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragActive(false)
        onFiles(Array.from(event.dataTransfer.files))
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-white/70 dark:bg-slate-900/50 px-6 py-14 text-center transition ${
        dragActive ? 'border-sky-400 bg-sky-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-500'
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
        <Icon size={22} />
      </span>
      <span className="text-sm font-medium">{title}</span>
      {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </label>
  )
}

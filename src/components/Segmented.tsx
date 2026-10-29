interface SegmentedProps<T extends string> {
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  ariaLabel?: string
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-950/60"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            value === option.id
              ? 'bg-slate-200 text-slate-900 shadow dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

import { CURRENCIES, useCurrency } from '../utils/locale'
import type { CurrencyCode } from '../utils/locale'
import { t } from '../utils/i18n'

export default function CurrencySelect() {
  const [currency, setCurrency] = useCurrency()
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      aria-label={t('Currency')}
      title={t('Currency')}
      className="h-10 rounded-lg bg-transparent px-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  )
}

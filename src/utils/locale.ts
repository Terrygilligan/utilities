// Centralized device-locale formatting (navigator.language + Intl).
export const LOCALE = navigator.language || 'en-US'

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', IN: 'INR',
  BR: 'BRL', MX: 'MXN', ZA: 'ZAR', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', AE: 'AED', SA: 'SAR', SG: 'SGD', HK: 'HKD', KR: 'KRW', CN: 'CNY',
}
export const REGION = (() => {
  try {
    return new Intl.Locale(LOCALE).region ?? 'IE'
  } catch {
    return 'IE'
  }
})()
export const CURRENCY = REGION_CURRENCY[REGION] ?? 'EUR'

const moneyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })
export const fmtMoney = (n: number) => moneyFmt.format(n)

export const fmtNumber = (n: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(LOCALE, opts).format(n)

export const fmtBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log2(Math.max(bytes, 1)) / 10)))
  const value = bytes / 1024 ** i
  return `${fmtNumber(value, { maximumFractionDigits: i === 0 ? 0 : 1 })} ${units[i]}`
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDate = (d: Date | string | number) => dateFmt.format(new Date(d))

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
})
export const fmtDateTime = (d: Date | string | number) => dateTimeFmt.format(new Date(d))

export const fmtList = (items: string[], type: 'conjunction' | 'disjunction' = 'conjunction') =>
  new Intl.ListFormat(LOCALE, { type }).format(items)

// Centralized device-locale formatting (navigator.language + Intl).
import { useEffect, useState } from 'react'

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
export const CURRENCIES = ['EUR', 'GBP', 'USD'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]
export const CURRENCY_KEY = 'utility-hub.currency'
const CURRENCY_EVENT = 'utility-hub:currency'

const regionCurrency = REGION_CURRENCY[REGION]

export function getCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem(CURRENCY_KEY)
    if ((CURRENCIES as readonly string[]).includes(stored ?? '')) {
      return stored as CurrencyCode
    }
  } catch {
    // storage unavailable
  }
  return (CURRENCIES as readonly string[]).includes(regionCurrency ?? '')
    ? (regionCurrency as CurrencyCode)
    : 'EUR'
}

export function setCurrency(code: CurrencyCode) {
  try {
    localStorage.setItem(CURRENCY_KEY, code)
  } catch {
    // storage unavailable — still notify listeners for this session
  }
  window.dispatchEvent(new Event(CURRENCY_EVENT))
}

export function useCurrency(): [CurrencyCode, (code: CurrencyCode) => void] {
  const [currency, set] = useState<CurrencyCode>(getCurrency)
  useEffect(() => {
    const update = () => set(getCurrency())
    window.addEventListener(CURRENCY_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(CURRENCY_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [])
  return [currency, setCurrency]
}

const moneyFmts = new Map<string, Intl.NumberFormat>()
export const fmtMoney = (n: number, currency: string = getCurrency()) => {
  let fmt = moneyFmts.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency })
    moneyFmts.set(currency, fmt)
  }
  return fmt.format(n)
}

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

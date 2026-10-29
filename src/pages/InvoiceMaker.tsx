import { Plus, Printer, Trash2 } from 'lucide-react'
import { cardCls, inputCls } from '../components/ui'
import SaveBadge from '../components/SaveBadge'
import { usePersistentState } from '../lib/persist'
import { fmtMoney, useCurrency } from '../utils/locale'
import { t } from '../utils/i18n'

interface Item {
  desc: string
  qty: number
  price: number
}

interface Invoice {
  number: string
  date: string
  from: string
  to: string
  vat: number
  notes: string
  items: Item[]
}

const emptyItem = (): Item => ({ desc: '', qty: 1, price: 0 })

const initial: Invoice = {
  number: 'INV-001',
  date: new Date().toISOString().slice(0, 10),
  from: '',
  to: '',
  vat: 20,
  notes: '',
  items: [emptyItem()],
}

export default function InvoiceMaker() {
  const [inv, setInv, saveState] = usePersistentState<Invoice>('utility-hub.invoice', initial)
  const [currency] = useCurrency()

  const set = <K extends keyof Invoice>(key: K, value: Invoice[K]) =>
    setInv((v) => ({ ...v, [key]: value }))
  const setItem = (i: number, patch: Partial<Item>) =>
    setInv((v) => ({ ...v, items: v.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))
  const addItem = () => setInv((v) => ({ ...v, items: [...v.items, emptyItem()] }))
  const removeItem = (i: number) =>
    setInv((v) => ({ ...v, items: v.items.filter((_, j) => j !== i) }))

  const subtotal = inv.items.reduce((s, it) => s + it.qty * it.price, 0)
  const vatAmt = (subtotal * inv.vat) / 100
  const total = subtotal + vatAmt

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500/15 px-4 text-sm font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-400'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">{t('Invoice Maker')}</h1>
        <SaveBadge state={saveState} />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400 print:hidden">
        {t('Fill in your details and line items, then print or save a clean PDF invoice — everything stays on your device.')}
      </p>

      <div className="mt-6 space-y-4 print:hidden">
        <div className={cardCls}>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t('Invoice number')}</span>
              <input value={inv.number} onChange={(e) => set('number', e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t('Invoice date')}</span>
              <input type="date" value={inv.date} onChange={(e) => set('date', e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t('VAT %')}</span>
              <input
                type="number" min={0} max={100} value={inv.vat}
                onChange={(e) => set('vat', Math.max(0, Math.min(100, +e.target.value || 0)))}
                className={`${inputCls} mt-1`}
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t('From (you)')}</span>
              <textarea rows={3} value={inv.from} onChange={(e) => set('from', e.target.value)} className={`${inputCls} mt-1`} placeholder={t('Your name, address, contact')} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t('Bill to')}</span>
              <textarea rows={3} value={inv.to} onChange={(e) => set('to', e.target.value)} className={`${inputCls} mt-1`} placeholder={t('Client name, address, contact')} />
            </label>
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('Items')}</span>
            <button type="button" onClick={addItem} className={btn}>
              <Plus size={15} /> {t('Add item')}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {inv.items.map((it, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })}
                  placeholder={t('Item description')} className={`${inputCls} min-w-40 flex-1`}
                />
                <input
                  type="number" min={0} step="any" value={it.qty}
                  onChange={(e) => setItem(i, { qty: +e.target.value || 0 })}
                  className={`${inputCls} w-20`} aria-label={t('Qty')}
                />
                <input
                  type="number" min={0} step="any" value={it.price}
                  onChange={(e) => setItem(i, { price: +e.target.value || 0 })}
                  className={`${inputCls} w-28`} aria-label={t('Unit price')}
                />
                <span className="w-28 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">
                  {fmtMoney(it.qty * it.price, currency)}
                </span>
                <button
                  type="button" onClick={() => removeItem(i)} disabled={inv.items.length === 1}
                  aria-label={t('Remove item')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-red-500 disabled:opacity-30 dark:hover:bg-slate-800"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-medium text-slate-500">{t('Notes')}</span>
            <textarea rows={2} value={inv.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls} mt-1`} placeholder={t('Payment terms, bank details, thanks…')} />
          </label>
        </div>

        <button type="button" onClick={() => window.print()} className={btn}>
          <Printer size={15} /> {t('Print / PDF')}
        </button>
      </div>

      <div className="print-sheet mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t('Invoice')}</h2>
            <p className="text-sm text-slate-600">{inv.number}</p>
            <p className="text-sm text-slate-600">{inv.date}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('From (you)')}</p>
              <p className="mt-1 whitespace-pre-line">{inv.from}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('Bill to')}</p>
              <p className="mt-1 whitespace-pre-line">{inv.to}</p>
            </div>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-2">{t('Item description')}</th>
              <th className="pb-2 text-right">{t('Qty')}</th>
              <th className="pb-2 text-right">{t('Unit price')}</th>
              <th className="pb-2 text-right">{t('Amount')}</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="py-2 pr-2">{it.desc}</td>
                <td className="py-2 text-right tabular-nums">{it.qty}</td>
                <td className="py-2 text-right tabular-nums">{fmtMoney(it.price, currency)}</td>
                <td className="py-2 text-right tabular-nums">{fmtMoney(it.qty * it.price, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">{t('Subtotal')}</span>
            <span className="tabular-nums">{fmtMoney(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t('VAT')} {inv.vat}%</span>
            <span className="tabular-nums">{fmtMoney(vatAmt, currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
            <span>{t('Total')}</span>
            <span className="tabular-nums">{fmtMoney(total, currency)}</span>
          </div>
        </div>

        {inv.notes && <p className="mt-6 whitespace-pre-line text-xs text-slate-600">{inv.notes}</p>}
      </div>
    </div>
  )
}

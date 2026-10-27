# Utility Hub — User Guide

## Receipt & Expense Tracker (`/expenses`)

Everything stays on your device — photos, entries and exports never leave the browser.

### Scanning a receipt

1. **Scan bill** opens the camera (or a file picker if the camera isn't available). You can also drop a receipt photo onto the dropzone.
2. The photo appears as a preview and OCR starts automatically — a "Processing receipt…" banner shows while it works (first scan downloads the recognition data, ~6 MB, cached for offline use afterwards).
3. When it finishes, the note tells you what was filled — check the fields before pressing **Add expense**. OCR only fills the form; nothing is saved until you press the button.
4. **Extract receipt data** re-runs OCR on the same photo; **Clear** removes it.
5. **View recognized text** (under the note) shows the raw OCR output — handy when a field looks wrong.

What the scan fills:

- **Vendor** — prefers lines that look like a business (аптека, магазин, ООД, ЕООД, pharmacy, ltd…) and skips receipt headers (касов бон, фискален, ЕИК, ЗДДС, Оператор…).
- **Date** — ISO `YYYY-MM-DD` or `DD/MM/YYYY` formats; implausible years are ignored.
- **Amount** — the number on the total line (total/итог/общо/сума/дължим/платено), else the largest amount printed next to a currency marker, else the largest amount on the slip.
- **Currency** — auto-detected from the receipt text: `€` or `EUR` → EUR, `£` → GBP, `$` → USD, ISO codes (USD, CHF, RON, …) → that code, and `лв.`/`лева`/`BGN` → **EUR** (Bulgaria adopted the euro — see note below).

> **Old lev receipts:** since 2026 Bulgaria is on the euro, so `лв`/`BGN` on a receipt is recorded as **EUR** — the printed number is kept as-is, with no conversion. Only scan euro-priced receipts, or correct the currency/amount manually if you archive an old lev slip.

Tips for better scans:

- Good lighting, fill the frame with the receipt, keep it flat — thermal print fades fast.
- If the text comes out garbled, retake the photo sharper rather than re-running OCR on the same image.

### Entries

- Vendor, date, amount + currency, category (built-ins or **Custom…**, Cyrillic-safe), optional entity, notes and VAT % (VAT shown as the included portion).
- Edit (pencil) or delete (bin) any row; edits go back into the form.
- Entries persist in the browser (`utility-hub.expenses.v1`) and ride in **Export backup** in the sidebar.

### Summary & charts

The summary card shows per-currency totals and a monthly average, plus:

- **Currency toggle** — EUR/GBP/USD plus any other currency found in your entries; each chart shows one currency at a time (no mixing, no fake exchange rates).
- **Monthly spend** — bar chart by month for the selected currency (hover a bar for the exact amount).
- **By category** — donut chart for the selected currency with a legend of amounts and percentages.

### Export

- **CSV** downloads `expenses.csv` — UTF-8 with BOM, `Date, Vendor, Amount, Currency, Category, Entity, VAT, Notes` headers; opens cleanly in Excel/LibreOffice (Cyrillic-safe).
- **Excel** downloads `expenses.xlsx`: an `Expenses` sheet (one row per entry, incl. VAT breakdown) and a `Summary` sheet (totals, per-month and per-category tables with one column per currency used).
- **Share** sends the same workbook via the system share sheet (or downloads it where sharing isn't available).

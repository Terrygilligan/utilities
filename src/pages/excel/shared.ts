import type { WorkBook } from 'xlsx'

let cached: Promise<typeof import('xlsx')> | null = null

export const loadXlsx = () => (cached ??= import('xlsx'))

export const SPREADSHEET_ACCEPT = '.xlsx,.xls,.xlsm,.ods'

export const isSpreadsheet = (file: File) => /\.(xlsx|xlsm?|ods)$/i.test(file.name)

export async function openWorkbook(file: File): Promise<WorkBook> {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  if (workbook.SheetNames.length === 0) throw new Error('Workbook contains no sheets')
  return workbook
}

export async function sheetRows(workbook: WorkBook, sheetName: string): Promise<string[][]> {
  const XLSX = await loadXlsx()
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: false,
  })
  return rows.map((row) => row.map((cell) => (cell == null ? '' : String(cell))))
}

export function sheetSelectClass() {
  return 'rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200'
}

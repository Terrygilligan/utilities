import { LANG, LANGS, getLangPref, setLang, t } from '../utils/i18n'
import type { LangPref } from '../utils/i18n'

export default function LangSelect() {
  return (
    <select
      value={getLangPref()}
      onChange={(e) => setLang(e.target.value as LangPref)}
      aria-label={t('Language')}
      title={t('Language')}
      className="h-10 rounded-lg bg-transparent px-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <option value="auto">
        {t('Auto')} · {LANG.toUpperCase()}
      </option>
      {LANGS.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  )
}

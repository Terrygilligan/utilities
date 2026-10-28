// Lightweight i18n: English source strings act as keys; per-language
// dictionaries override. Missing keys fall back to English automatically.
// Detection: first supported prefix in navigator.languages, unless an
// explicit preference is stored in utility-hub.lang.
export type Lang = 'en' | 'bg' | 'es' | 'fr' | 'de' | 'nl'
export type LangPref = Lang | 'auto'

export const LANGS: Lang[] = ['en', 'bg', 'es', 'fr', 'de', 'nl']
const SUPPORTED: Lang[] = ['bg', 'es', 'fr', 'de', 'nl']
const LANG_KEY = 'utility-hub.lang'

export function getLangPref(): LangPref {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'auto' || (LANGS as string[]).includes(stored ?? '')) {
      return stored as LangPref
    }
  } catch {
    // storage unavailable — fall through to auto
  }
  return 'auto'
}

export function setLang(pref: LangPref) {
  try {
    localStorage.setItem(LANG_KEY, pref)
  } catch {
    // storage unavailable — reload applies nothing new, still harmless
  }
  window.location.reload()
}

const detect = (): Lang => {
  const prefs = navigator.languages ?? [navigator.language]
  for (const p of prefs) {
    const short = p.slice(0, 2).toLowerCase() as Lang
    if (SUPPORTED.includes(short)) return short
  }
  return 'en'
}

export const LANG: Lang = (() => {
  const pref = getLangPref()
  return pref === 'auto' ? detect() : pref
})()

type Dict = Record<string, string>
const dicts: Record<Exclude<Lang, 'en'>, Dict> = {
  bg: {
    'All Tools': 'Всички инструменти',
    'PDF Tools': 'PDF инструменти',
    'QR Scanner': 'QR скенер',
    'Excel & CSV': 'Excel и CSV',
    'Notebook': 'Бележник',
    'Voice Tools': 'Гласови инструменти',
    'Passwords': 'Пароли',
    'Image Optimizer': 'Оптимизатор на изображения',
    'Regex & JSON': 'Regex и JSON',
    'Unit Converter': 'Конвертор на единици',
    'Color Tools': 'Инструменти за цветове',
    'Media Tools': 'Медийни инструменти',
    'Checksums': 'Контролни суми',
    'SVG Optimizer': 'SVG оптимизатор',
    'Diff Checker': 'Сравнение на текст',
    'Expenses': 'Разходи',
    'Text Tools': 'Текстови инструменти',
    'Calc & Time': 'Калкулатор и час',
    'Text Workbench': 'Текстова работилница',
    'Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.': 'Регистър, сортиране и дедуплициране на редове, броене на думи и lorem ipsum.',
    'Calc & Time Converter': 'Калкулатор и конвертор на час',
    'Percentages, VAT, and timezone conversion — formatted for your device locale.': 'Проценти, ДДС и конверсия на часови зони — форматирано за вашия регион.',
    'What do you need today?': 'Какво ви трябва днес?',
    'A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.':
      'Нарастваща колекция от ежедневни инструменти, които работят изцяло в браузъра ви — без качване, без акаунти, работи офлайн след инсталиране.',
    'PDF Reader & Converter': 'PDF четец и конвертор',
    'Open, read, and convert PDF documents right on your device. Files never leave your machine.':
      'Отваряйте, четете и конвертирайте PDF документи на устройството си. Файловете никога не напускат машината ви.',
    'QR Code Scanner': 'QR код скенер',
    'Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.':
      'Насочете камерата към QR код, за да прочетете връзки, Wi-Fi данни и други.',
    'Excel & CSV Converter': 'Excel и CSV конвертор',
    'Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.':
      'Преглеждайте таблици, експортирайте листове към PDF или CSV и създавайте работни книги от CSV файлове.',
    'Markdown Notebook': 'Markdown бележник',
    'Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.':
      'Бележки без разсейване с жив преглед и автоматично запазване. Експорт към Markdown, HTML или PDF.',
    'Dictate text with speech-to-text, or have any text read aloud with text-to-speech.':
      'Диктувайте текст чрез разпознаване на реч или оставете текста да бъде прочетен на глас.',
    'Password Generator': 'Генератор на пароли',
    'Cryptographically random passphrases and complex passwords with a live entropy meter.':
      'Криптографски случайни паролни фрази и сложни пароли с индикатор за ентропия.',
    'Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.':
      'Преоразмерявайте, компресирайте и конвертирайте изображения към WebP или JPEG — EXIF данните се премахват автоматично.',
    'Regex & JSON Playground': 'Regex и JSON площадка',
    'Test regular expressions with live match highlighting, plus a JSON formatter and validator.':
      'Тествайте регулярни изрази с подсветка на съвпаденията, плюс JSON форматиране и валидиране.',
    'Instant offline conversions for length, weight, temperature, and data storage.':
      'Мигновени офлайн конверсии за дължина, тегло, температура и данни.',
    'Color picker, tint and shade palette generator, and WCAG contrast checking.':
      'Избор на цвят, генератор на нюанси и проверка на контраст по WCAG.',
    'Media Compressor': 'Медиен компресор',
    'Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.':
      'Подрязвайте и прекодирайте видео и аудио локално към WebM — без качване, без сървър.',
    'Checksum Calculator': 'Калкулатор на контролни суми',
    'SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.':
      'SHA-256, SHA-1 и MD5 хешове, изчислени в паметта, с проверка на съвпадение.',
    'Strip comments, editor metadata, and empty attributes from SVG markup.':
      'Премахва коментари, метаданни на редактора и празни атрибути от SVG код.',
    'Text Diff Checker': 'Проверка на разлики в текст',
    'Side-by-side line-by-line diff with red/green highlighting, computed locally.':
      'Ред по ред сравнение с червено/зелено маркиране, изчислено локално.',
    'Expense Tracker': 'Проследяване на разходи',
    'Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.':
      'Снимайте касови бележки, въвеждайте данни в местната валута и експортирайте към Excel.',
    'More tools coming soon': 'Скоро още инструменти',
    'Open tool': 'Отвори инструмента',
    'Buy me a coffee': 'Купете ми кафе',
    '100% Client-Side & Private · Zero Server Tracking · TOG Utilities':
      '100% на устройството и лично · Нула сървърно проследяване · TOG Utilities',
    'Installable PWA — works offline': 'Инсталируем PWA — работи офлайн',
    'Add to Home Screen': 'Добави към началния екран',
    'On mobile: browser menu → "Add to Home Screen". On desktop: install icon in the address bar.':
      'На телефон: меню на браузъра → „Добави към началния екран“. На компютър: икона за инсталиране в адресната лента.',
    'Share': 'Сподели',
    'Shared': 'Споделено',
    'Saved': 'Запазено',
    'Copied!': 'Копирано!',
    'Export backup': 'Експорт на копие',
    'Restore backup': 'Възстанови копие',
    'Clear data': 'Изчисти данните',
    'Last backup': 'Последно копие',
    'never': 'никога',
    'Storage': 'Хранилище',
    'Backup files contain authenticator secrets — store them safely':
      'Файлът с копие съдържа кодове за автентикация — пазете го на сигурно място',
    'Restore this backup? It replaces ALL current app data (notes, expenses, authenticator accounts, theme) with the file contents.':
      'Да се възстанови ли това копие? То заменя ВСИЧКИ текущи данни на приложението (бележки, разходи, акаунти за автентикация, тема) със съдържанието на файла.',
    'Backup restored. The app will now reload.': 'Копието е възстановено. Приложението ще се презареди.',
    'Clear all app data on this device? This cannot be undone.':
      'Да се изчистят ли всички данни на приложението на това устройство? Това не може да бъде отменено.',
    'Really clear everything? Export a backup first if you need one.':
      'Наистина ли да се изчисти всичко? Първо експортирайте копие, ако ви трябва.',
    'Documents & Data': 'Документи и данни',
    'Developer & Code': 'Разработка и код',
    'Media & Design': 'Медия и дизайн',
    'Math, Time & Conversion': 'Математика, време и конверсии',
    'Scanners & Codes': 'Скенери и кодове',
    'Security & Finance': 'Сигурност и финанси',
    'Audio & Misc': 'Аудио и разни',
    'SQL Sandbox': 'SQL пясъчник',
    'Currency': 'Валута',
    'Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.':
      'Изпълнявайте SQL заявки в реална SQLite машина чрез WebAssembly — инспектирайте схемата, импортирайте и експортирайте .sqlite файлове.',
    'Reorder tools': 'Подреди инструментите',
    'Done': 'Готово',
    'Favorites': 'Любими',
    'Add to favorites': 'Добави в любими',
    'Remove from favorites': 'Премахни от любими',
    'Move up': 'Премести нагоре',
    'Move down': 'Премести надолу',
    'Report a Bug': 'Докладвай грешка',
    'Found a Bug?': 'Намери грешка?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. There is no corporate support desk, and I don\'t have the time or energy to answer individual support emails.':
      'Този набор от инструменти е създаден и се поддържа изцяло от 76-годишен независим разработчик, живеещ в къща на село. Няма корпоративен отдел за поддръжка и нямам времето и силите да отговарям на отделни имейли за поддръжка.',
    'However, if you spot a bug or broken feature, let me know anyway! I regularly update and patch the app, so your bug reports go straight into the fix queue for the next update.':
      'Но ако забележите грешка или неработеща функция, все пак ми пишете! Редовно актуализирам и поправям приложението, така че докладите за грешки отиват направо в опашката за поправки към следващата актуализация.',
    'Copy diagnostics': 'Копирай диагностика',
    'Copies anonymous technical details (browser, storage usage) — no personal data.':
      'Копира анонимни технически данни (браузър, използвано хранилище) — без лични данни.',
    'Open GitHub issues': 'Отвори GitHub проблеми',
    'Close': 'Затвори',
    'Language': 'Език',
    'Auto': 'Авто',
    'Suggest a Feature': 'Предложи функция',
    'Have a Feature Idea?': 'Имате идея за функция?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. I only build tools that I personally find useful or enjoy crafting, so I can\'t promise to build every suggestion.':
      'Този набор от инструменти е създаден и се поддържа изцяло от 76-годишен независим разработчик, живеещ в къща на село. Създавам само инструменти, които самият аз намирам за полезни или ми е удоволствие да правя, така че не мога да обещая да реализирам всяко предложение.',
    'However, if you have a brilliant idea for a lightweight, offline-first tool, share it anyway! If it tickles my curiosity, it just might show up in a future update.':
      'Но ако имате блестяща идея за лек, офлайн инструмент, все пак я споделете! Ако събуди любопитството ми, може просто да се появи в следваща актуализация.',
    'Describe your idea…': 'Опишете идеята си…',
    'Copy idea details': 'Копирай идеята',
    'Your idea is copied — paste it into a GitHub issue or anywhere handy.':
      'Идеята е копирана — поставете я в GitHub проблем или където ви е удобно.',
    'What\'s new in': 'Новото в',
    'What\'s new': 'Новото',
    'Take Tour': 'Разгледай',
    'Dismiss': 'Скрий',
    'Dashboard Customization': 'Персонализация на таблото',
    'Pin your favorite tools and reorder the dashboard cards — your layout is saved on this device.':
      'Закачи любимите си инструменти и пренареди картите на таблото — подредбата се пази на това устройство.',
    'Global Feedback': 'Обратна връзка навсякъде',
    'Report a bug or suggest a feature from the footer links on any page — they go straight to the fix queue.':
      'Докладвай грешка или предложи функция от връзките в долния колонтитул на всяка страница — отиват направо в опашката за поправки.',
    'Private by design': 'Поверително по дизайн',
    'Look for the "Saved locally" badge — everything you enter stays on this device, in your browser.':
      'Гледай за значката „Saved locally" — всичко, което въвеждаш, остава на това устройство, в браузъра ти.',
    'Don\'t show update announcements in the future': 'Не показвай известия за новини в бъдеще',
    'Next': 'Напред',
    'Back': 'Назад',
    'Settings': 'Настройки',
    'Preferences': 'Предпочитания',
    'Show feature update announcements': 'Показвай известия за нови функции',
  },
  es: {
    'All Tools': 'Todas las herramientas',
    'PDF Tools': 'Herramientas PDF',
    'QR Scanner': 'Escáner QR',
    'Excel & CSV': 'Excel y CSV',
    'Notebook': 'Bloc de notas',
    'Voice Tools': 'Herramientas de voz',
    'Passwords': 'Contraseñas',
    'Image Optimizer': 'Optimizador de imágenes',
    'Regex & JSON': 'Regex y JSON',
    'Unit Converter': 'Conversor de unidades',
    'Color Tools': 'Herramientas de color',
    'Media Tools': 'Herramientas multimedia',
    'Checksums': 'Sumas de verificación',
    'SVG Optimizer': 'Optimizador SVG',
    'Diff Checker': 'Comparador de texto',
    'Expenses': 'Gastos',
    'Text Tools': 'Herramientas de texto',
    'Calc & Time': 'Cálculo y hora',
    'Text Workbench': 'Banco de texto',
    'Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.': 'Conversión de mayúsculas, ordenación y deduplicación de líneas, recuento y lorem ipsum.',
    'Calc & Time Converter': 'Cálculo y hora mundial',
    'Percentages, VAT, and timezone conversion — formatted for your device locale.': 'Porcentajes, IVA y conversión de zonas horarias — formateado para tu región.',
    'What do you need today?': '¿Qué necesitas hoy?',
    'A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.':
      'Una colección creciente de utilidades que funcionan totalmente en tu navegador — sin subidas, sin cuentas, funciona sin conexión una vez instalada.',
    'PDF Reader & Converter': 'Lector y conversor de PDF',
    'Open, read, and convert PDF documents right on your device. Files never leave your machine.':
      'Abre, lee y convierte documentos PDF en tu dispositivo. Los archivos nunca salen de tu equipo.',
    'QR Code Scanner': 'Escáner de códigos QR',
    'Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.':
      'Apunta tu cámara a un código QR para leer enlaces, credenciales Wi-Fi y más al instante.',
    'Excel & CSV Converter': 'Conversor de Excel y CSV',
    'Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.':
      'Previsualiza hojas de cálculo, exporta a PDF o CSV y compila archivos CSV en un libro.',
    'Markdown Notebook': 'Bloc de notas Markdown',
    'Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.':
      'Notas sin distracciones con vista previa en vivo y autoguardado. Exporta a Markdown, HTML o PDF.',
    'Dictate text with speech-to-text, or have any text read aloud with text-to-speech.':
      'Dicta texto con reconocimiento de voz o escucha cualquier texto en voz alta.',
    'Password Generator': 'Generador de contraseñas',
    'Cryptographically random passphrases and complex passwords with a live entropy meter.':
      'Frases de contraseña y contraseñas complejas aleatorias con medidor de entropía en vivo.',
    'Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.':
      'Redimensiona, comprime y convierte imágenes a WebP o JPEG — los datos EXIF se eliminan automáticamente.',
    'Regex & JSON Playground': 'Zona de pruebas Regex y JSON',
    'Test regular expressions with live match highlighting, plus a JSON formatter and validator.':
      'Prueba expresiones regulares con resaltado en vivo, más formateador y validador de JSON.',
    'Instant offline conversions for length, weight, temperature, and data storage.':
      'Conversiones instantáneas sin conexión: longitud, peso, temperatura y datos.',
    'Color picker, tint and shade palette generator, and WCAG contrast checking.':
      'Selector de color, generador de paletas y comprobación de contraste WCAG.',
    'Media Compressor': 'Compresor multimedia',
    'Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.':
      'Recorta y recodifica vídeo y audio localmente a WebM — sin subidas ni servidores.',
    'Checksum Calculator': 'Calculadora de sumas de verificación',
    'SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.':
      'Hashes SHA-256, SHA-1 y MD5 calculados en memoria, con comparación.',
    'Strip comments, editor metadata, and empty attributes from SVG markup.':
      'Elimina comentarios, metadatos de editores y atributos vacíos del código SVG.',
    'Text Diff Checker': 'Comparador de texto',
    'Side-by-side line-by-line diff with red/green highlighting, computed locally.':
      'Comparación línea por línea con resaltado rojo/verde, calculada localmente.',
    'Expense Tracker': 'Registro de gastos',
    'Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.':
      'Fotografía recibos, registra datos en tu moneda local y exporta un libro de Excel.',
    'More tools coming soon': 'Pronto más herramientas',
    'Open tool': 'Abrir herramienta',
    'Buy me a coffee': 'Invítame a un café',
    '100% Client-Side & Private · Zero Server Tracking · TOG Utilities':
      '100% local y privado · Cero rastreo en servidores · TOG Utilities',
    'Installable PWA — works offline': 'PWA instalable — funciona sin conexión',
    'Add to Home Screen': 'Añadir a pantalla de inicio',
    'On mobile: browser menu → "Add to Home Screen". On desktop: install icon in the address bar.':
      'En el móvil: menú del navegador → "Añadir a pantalla de inicio". En el escritorio: icono de instalación en la barra de direcciones.',
    'Share': 'Compartir',
    'Shared': 'Compartido',
    'Saved': 'Guardado',
    'Copied!': '¡Copiado!',
    'Export backup': 'Exportar copia',
    'Restore backup': 'Restaurar copia',
    'Clear data': 'Borrar datos',
    'Last backup': 'Última copia',
    'never': 'nunca',
    'Storage': 'Almacenamiento',
    'Backup files contain authenticator secrets — store them safely':
      'Los archivos de copia contienen secretos del autenticador — guárdalos en un lugar seguro',
    'Restore this backup? It replaces ALL current app data (notes, expenses, authenticator accounts, theme) with the file contents.':
      '¿Restaurar esta copia? Reemplaza TODOS los datos actuales de la app (notas, gastos, cuentas de autenticación, tema) con el contenido del archivo.',
    'Backup restored. The app will now reload.': 'Copia restaurada. La app se recargará ahora.',
    'Clear all app data on this device? This cannot be undone.':
      '¿Borrar todos los datos de la app en este dispositivo? Esto no se puede deshacer.',
    'Really clear everything? Export a backup first if you need one.':
      '¿Borrar todo de verdad? Exporta primero una copia si la necesitas.',
    'Documents & Data': 'Documentos y datos',
    'Developer & Code': 'Desarrollo y código',
    'Media & Design': 'Multimedia y diseño',
    'Math, Time & Conversion': 'Matemáticas, tiempo y conversión',
    'Scanners & Codes': 'Escáneres y códigos',
    'Security & Finance': 'Seguridad y finanzas',
    'Audio & Misc': 'Audio y varios',
    'SQL Sandbox': 'SQL Sandbox',
    'Currency': 'Moneda',
    'Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.':
      'Ejecuta consultas SQL en un motor SQLite real mediante WebAssembly: inspecciona el esquema, importa y exporta archivos .sqlite.',
    'Reorder tools': 'Reordenar herramientas',
    'Done': 'Hecho',
    'Favorites': 'Favoritos',
    'Add to favorites': 'Añadir a favoritos',
    'Remove from favorites': 'Quitar de favoritos',
    'Move up': 'Subir',
    'Move down': 'Bajar',
    'Report a Bug': 'Informar de un error',
    'Found a Bug?': '¿Encontraste un error?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. There is no corporate support desk, and I don\'t have the time or energy to answer individual support emails.':
      'Este conjunto de utilidades está creado y mantenido en su totalidad por un desarrollador independiente de 76 años que vive en una granja. No hay un servicio de soporte corporativo y no tengo tiempo ni energía para responder correos de soporte individuales.',
    'However, if you spot a bug or broken feature, let me know anyway! I regularly update and patch the app, so your bug reports go straight into the fix queue for the next update.':
      'Sin embargo, si detectas un error o una función rota, ¡avísame de todos modos! Actualizo y corrijo la aplicación con regularidad, así que tus informes de errores van directamente a la cola de correcciones de la próxima actualización.',
    'Copy diagnostics': 'Copiar diagnóstico',
    'Copies anonymous technical details (browser, storage usage) — no personal data.':
      'Copia detalles técnicos anónimos (navegador, uso de almacenamiento): sin datos personales.',
    'Open GitHub issues': 'Abrir issues en GitHub',
    'Close': 'Cerrar',
    'Language': 'Idioma',
    'Auto': 'Auto',
    'Suggest a Feature': 'Sugerir una función',
    'Have a Feature Idea?': '¿Tienes una idea para una función?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. I only build tools that I personally find useful or enjoy crafting, so I can\'t promise to build every suggestion.':
      'Este conjunto de utilidades está creado y mantenido en su totalidad por un desarrollador independiente de 76 años que vive en una granja. Solo construyo herramientas que personalmente me resultan útiles o disfruto creando, así que no puedo prometer construir cada sugerencia.',
    'However, if you have a brilliant idea for a lightweight, offline-first tool, share it anyway! If it tickles my curiosity, it just might show up in a future update.':
      'Sin embargo, si tienes una idea brillante para una herramienta ligera que funcione sin conexión, ¡compártela de todos modos! Si despierta mi curiosidad, podría aparecer en una futura actualización.',
    'Describe your idea…': 'Describe tu idea…',
    'Copy idea details': 'Copiar la idea',
    'Your idea is copied — paste it into a GitHub issue or anywhere handy.':
      'Tu idea está copiada — pégala en un issue de GitHub o donde prefieras.',
    'What\'s new in': 'Novedades en',
    'What\'s new': 'Novedades',
    'Take Tour': 'Ver el tour',
    'Dismiss': 'Descartar',
    'Dashboard Customization': 'Personalización del panel',
    'Pin your favorite tools and reorder the dashboard cards — your layout is saved on this device.':
      'Fija tus herramientas favoritas y reordena las tarjetas del panel — tu disposición se guarda en este dispositivo.',
    'Global Feedback': 'Comentarios globales',
    'Report a bug or suggest a feature from the footer links on any page — they go straight to the fix queue.':
      'Informa de un error o sugiere una función desde los enlaces del pie en cualquier página — van directamente a la cola de correcciones.',
    'Private by design': 'Privado por diseño',
    'Look for the "Saved locally" badge — everything you enter stays on this device, in your browser.':
      'Busca la insignia "Saved locally" — todo lo que introduces se queda en este dispositivo, en tu navegador.',
    'Don\'t show update announcements in the future': 'No mostrar anuncios de novedades en el futuro',
    'Next': 'Siguiente',
    'Back': 'Atrás',
    'Settings': 'Ajustes',
    'Preferences': 'Preferencias',
    'Show feature update announcements': 'Mostrar anuncios de nuevas funciones',
  },
  fr: {
    'All Tools': 'Tous les outils',
    'PDF Tools': 'Outils PDF',
    'QR Scanner': 'Scanner QR',
    'Excel & CSV': 'Excel et CSV',
    'Notebook': 'Bloc-notes',
    'Voice Tools': 'Outils vocaux',
    'Passwords': 'Mots de passe',
    'Image Optimizer': 'Optimiseur d’images',
    'Regex & JSON': 'Regex et JSON',
    'Unit Converter': 'Convertisseur d’unités',
    'Color Tools': 'Outils de couleur',
    'Media Tools': 'Outils multimédia',
    'Checksums': 'Sommes de contrôle',
    'SVG Optimizer': 'Optimiseur SVG',
    'Diff Checker': 'Comparateur de texte',
    'Expenses': 'Dépenses',
    'Text Tools': 'Outils de texte',
    'Calc & Time': 'Calcul et heure',
    'Text Workbench': 'Atelier de texte',
    'Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.': 'Conversion de casse, tri et déduplication de lignes, comptage et lorem ipsum.',
    'Calc & Time Converter': 'Calcul et fuseaux horaires',
    'Percentages, VAT, and timezone conversion — formatted for your device locale.': 'Pourcentages, TVA et conversion de fuseaux horaires — formaté pour votre région.',
    'What do you need today?': 'Que vous faut-il aujourd’hui ?',
    'A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.':
      'Une collection grandissante d’utilitaires qui fonctionnent entièrement dans votre navigateur — aucun envoi, aucun compte, fonctionne hors ligne une fois installée.',
    'PDF Reader & Converter': 'Lecteur et convertisseur PDF',
    'Open, read, and convert PDF documents right on your device. Files never leave your machine.':
      'Ouvrez, lisez et convertissez des documents PDF sur votre appareil. Vos fichiers ne quittent jamais votre machine.',
    'QR Code Scanner': 'Scanner de codes QR',
    'Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.':
      'Pointez votre caméra sur un code QR pour lire instantanément des liens, identifiants Wi-Fi et plus.',
    'Excel & CSV Converter': 'Convertisseur Excel et CSV',
    'Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.':
      'Prévisualisez des feuilles, exportez-les en PDF ou CSV et compilez des fichiers CSV en classeur.',
    'Markdown Notebook': 'Bloc-notes Markdown',
    'Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.':
      'Notes sans distraction avec aperçu en direct et enregistrement automatique. Export en Markdown, HTML ou PDF.',
    'Dictate text with speech-to-text, or have any text read aloud with text-to-speech.':
      'Dictez du texte par reconnaissance vocale ou faites lire un texte à voix haute.',
    'Password Generator': 'Générateur de mots de passe',
    'Cryptographically random passphrases and complex passwords with a live entropy meter.':
      'Phrases de passe et mots de passe complexes générés aléatoirement avec jauge d’entropie.',
    'Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.':
      'Redimensionnez, compressez et convertissez vos images en WebP ou JPEG — métadonnées EXIF supprimées automatiquement.',
    'Regex & JSON Playground': 'Bac à sable Regex et JSON',
    'Test regular expressions with live match highlighting, plus a JSON formatter and validator.':
      'Testez des expressions régulières avec surlignage en direct, plus un formateur et validateur JSON.',
    'Instant offline conversions for length, weight, temperature, and data storage.':
      'Conversions instantanées hors ligne : longueur, poids, température et données.',
    'Color picker, tint and shade palette generator, and WCAG contrast checking.':
      'Sélecteur de couleur, générateur de palettes et vérification de contraste WCAG.',
    'Media Compressor': 'Compresseur multimédia',
    'Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.':
      'Découpez et réencodez vidéo et audio localement en WebM — sans envoi ni serveur.',
    'Checksum Calculator': 'Calculateur de sommes de contrôle',
    'SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.':
      'Hachages SHA-256, SHA-1 et MD5 calculés en mémoire, avec comparaison.',
    'Strip comments, editor metadata, and empty attributes from SVG markup.':
      'Supprime commentaires, métadonnées d’éditeur et attributs vides du code SVG.',
    'Text Diff Checker': 'Comparateur de texte',
    'Side-by-side line-by-line diff with red/green highlighting, computed locally.':
      'Comparaison ligne par ligne avec surlignage rouge/vert, calculée localement.',
    'Expense Tracker': 'Suivi des dépenses',
    'Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.':
      'Photographiez vos reçus, saisissez les données dans votre devise locale et exportez un classeur Excel.',
    'More tools coming soon': 'D’autres outils arrivent bientôt',
    'Open tool': 'Ouvrir l’outil',
    'Buy me a coffee': 'Offrez-moi un café',
    '100% Client-Side & Private · Zero Server Tracking · TOG Utilities':
      '100 % local et privé · Zéro suivi serveur · TOG Utilities',
    'Installable PWA — works offline': 'PWA installable — fonctionne hors ligne',
    'Add to Home Screen': 'Ajouter à l’écran d’accueil',
    'On mobile: browser menu → "Add to Home Screen". On desktop: install icon in the address bar.':
      'Sur mobile : menu du navigateur → « Ajouter à l’écran d’accueil ». Sur ordinateur : icône d’installation dans la barre d’adresse.',
    'Share': 'Partager',
    'Shared': 'Partagé',
    'Saved': 'Enregistré',
    'Copied!': 'Copié !',
    'Export backup': 'Exporter une sauvegarde',
    'Restore backup': 'Restaurer une sauvegarde',
    'Clear data': 'Effacer les données',
    'Last backup': 'Dernière sauvegarde',
    'never': 'jamais',
    'Storage': 'Stockage',
    'Backup files contain authenticator secrets — store them safely':
      'Les fichiers de sauvegarde contiennent vos secrets d’authentification — conservez-les en lieu sûr',
    'Restore this backup? It replaces ALL current app data (notes, expenses, authenticator accounts, theme) with the file contents.':
      'Restaurer cette sauvegarde ? Elle remplace TOUTES les données actuelles (notes, dépenses, comptes d’authentification, thème) par le contenu du fichier.',
    'Backup restored. The app will now reload.': 'Sauvegarde restaurée. L’app va se recharger.',
    'Clear all app data on this device? This cannot be undone.':
      'Effacer toutes les données de l’app sur cet appareil ? Action irréversible.',
    'Really clear everything? Export a backup first if you need one.':
      'Vraiment tout effacer ? Exportez d’abord une sauvegarde si besoin.',
    'Documents & Data': 'Documents et données',
    'Developer & Code': 'Développement et code',
    'Media & Design': 'Médias et design',
    'Math, Time & Conversion': 'Maths, temps et conversion',
    'Scanners & Codes': 'Scanners et codes',
    'Security & Finance': 'Sécurité et finances',
    'Audio & Misc': 'Audio et divers',
    'SQL Sandbox': 'Bac à sable SQL',
    'Currency': 'Devise',
    'Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.':
      'Exécutez des requêtes SQL dans un vrai moteur SQLite via WebAssembly — inspectez le schéma, importez et exportez des fichiers .sqlite.',
    'Reorder tools': 'Réorganiser les outils',
    'Done': 'Terminé',
    'Favorites': 'Favoris',
    'Add to favorites': 'Ajouter aux favoris',
    'Remove from favorites': 'Retirer des favoris',
    'Move up': 'Monter',
    'Move down': 'Descendre',
    'Report a Bug': 'Signaler un bug',
    'Found a Bug?': 'Un bug ?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. There is no corporate support desk, and I don\'t have the time or energy to answer individual support emails.':
      'Cette suite d’utilitaires est entièrement créée et maintenue par un développeur indépendant de 76 ans vivant dans une ferme. Il n’y a pas de support technique d’entreprise et je n’ai ni le temps ni l’énergie de répondre à des e-mails d’assistance individuels.',
    'However, if you spot a bug or broken feature, let me know anyway! I regularly update and patch the app, so your bug reports go straight into the fix queue for the next update.':
      'Mais si vous repérez un bug ou une fonctionnalité défectueuse, faites-le-moi savoir quand même ! Je mets régulièrement à jour et corrige l’application, donc vos rapports de bugs vont directement dans la file de correction de la prochaine mise à jour.',
    'Copy diagnostics': 'Copier le diagnostic',
    'Copies anonymous technical details (browser, storage usage) — no personal data.':
      'Copie des informations techniques anonymes (navigateur, utilisation du stockage) — aucune donnée personnelle.',
    'Open GitHub issues': 'Ouvrir les tickets GitHub',
    'Close': 'Fermer',
    'Language': 'Langue',
    'Auto': 'Auto',
    'Suggest a Feature': 'Suggérer une fonctionnalité',
    'Have a Feature Idea?': 'Une idée de fonctionnalité ?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. I only build tools that I personally find useful or enjoy crafting, so I can\'t promise to build every suggestion.':
      'Cette suite d’utilitaires est entièrement créée et maintenue par un développeur indépendant de 76 ans vivant dans une ferme. Je ne construis que des outils que je trouve personnellement utiles ou que j’ai plaisir à fabriquer, je ne peux donc pas promettre de réaliser chaque suggestion.',
    'However, if you have a brilliant idea for a lightweight, offline-first tool, share it anyway! If it tickles my curiosity, it just might show up in a future update.':
      'Mais si vous avez une idée brillante pour un outil léger et hors-ligne, partagez-la quand même ! Si elle pique ma curiosité, elle pourrait bien apparaître dans une prochaine mise à jour.',
    'Describe your idea…': 'Décrivez votre idée…',
    'Copy idea details': 'Copier l’idée',
    'Your idea is copied — paste it into a GitHub issue or anywhere handy.':
      'Votre idée est copiée — collez-la dans un ticket GitHub ou où vous voulez.',
    'What\'s new in': 'Nouveautés de',
    'What\'s new': 'Nouveautés',
    'Take Tour': 'Faire le tour',
    'Dismiss': 'Ignorer',
    'Dashboard Customization': 'Personnalisation du tableau de bord',
    'Pin your favorite tools and reorder the dashboard cards — your layout is saved on this device.':
      'Épinglez vos outils favoris et réorganisez les cartes du tableau — votre disposition est enregistrée sur cet appareil.',
    'Global Feedback': 'Retour global',
    'Report a bug or suggest a feature from the footer links on any page — they go straight to the fix queue.':
      'Signalez un bug ou suggérez une fonctionnalité depuis les liens du pied de page, sur n’importe quelle page — ils vont directement dans la file de correction.',
    'Private by design': 'Privé par conception',
    'Look for the "Saved locally" badge — everything you enter stays on this device, in your browser.':
      'Repérez le badge « Saved locally » — tout ce que vous saisissez reste sur cet appareil, dans votre navigateur.',
    'Don\'t show update announcements in the future': 'Ne plus afficher les annonces de nouveautés',
    'Next': 'Suivant',
    'Back': 'Retour',
    'Settings': 'Paramètres',
    'Preferences': 'Préférences',
    'Show feature update announcements': 'Afficher les annonces de nouvelles fonctionnalités',
  },
  de: {
    'All Tools': 'Alle Tools',
    'PDF Tools': 'PDF-Tools',
    'QR Scanner': 'QR-Scanner',
    'Excel & CSV': 'Excel & CSV',
    'Notebook': 'Notizbuch',
    'Voice Tools': 'Sprachtools',
    'Passwords': 'Passwörter',
    'Image Optimizer': 'Bild-Optimierer',
    'Regex & JSON': 'Regex & JSON',
    'Unit Converter': 'Einheitenrechner',
    'Color Tools': 'Farbtools',
    'Media Tools': 'Medientools',
    'Checksums': 'Prüfsummen',
    'SVG Optimizer': 'SVG-Optimierer',
    'Diff Checker': 'Textvergleich',
    'Expenses': 'Ausgaben',
    'Text Tools': 'Texttools',
    'Calc & Time': 'Rechner & Zeit',
    'Text Workbench': 'Textwerkstatt',
    'Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.': 'Groß-/Kleinschreibung, Zeilen sortieren und deduplizieren, Wortzählung und Lorem ipsum.',
    'Calc & Time Converter': 'Rechner & Zeitzonen',
    'Percentages, VAT, and timezone conversion — formatted for your device locale.': 'Prozente, MwSt. und Zeitzonen-Umrechnung — formatiert für deine Region.',
    'What do you need today?': 'Was brauchst du heute?',
    'A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.':
      'Eine wachsende Sammlung alltäglicher Werkzeuge, die komplett in deinem Browser laufen — keine Uploads, keine Konten, nach der Installation offline nutzbar.',
    'PDF Reader & Converter': 'PDF-Leser & Konverter',
    'Open, read, and convert PDF documents right on your device. Files never leave your machine.':
      'PDF-Dokumente direkt auf deinem Gerät öffnen, lesen und konvertieren. Dateien verlassen dein Gerät nie.',
    'QR Code Scanner': 'QR-Code-Scanner',
    'Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.':
      'Richte die Kamera auf einen QR-Code, um Links, WLAN-Daten und mehr sofort zu lesen.',
    'Excel & CSV Converter': 'Excel- & CSV-Konverter',
    'Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.':
      'Tabellen ansehen, Blätter als PDF oder CSV exportieren und CSV-Dateien zu einer Arbeitsmappe zusammenführen.',
    'Markdown Notebook': 'Markdown-Notizbuch',
    'Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.':
      'Ablenkungsfreie Notizen mit Live-Vorschau und Auto-Speichern. Export als Markdown, HTML oder PDF.',
    'Dictate text with speech-to-text, or have any text read aloud with text-to-speech.':
      'Text per Spracherkennung diktieren oder beliebigen Text vorlesen lassen.',
    'Password Generator': 'Passwort-Generator',
    'Cryptographically random passphrases and complex passwords with a live entropy meter.':
      'Kryptografisch zufällige Passphrasen und komplexe Passwörter mit Entropie-Anzeige.',
    'Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.':
      'Bilder skalieren, komprimieren und in WebP oder JPEG umwandeln — EXIF-Daten werden automatisch entfernt.',
    'Regex & JSON Playground': 'Regex- & JSON-Spielwiese',
    'Test regular expressions with live match highlighting, plus a JSON formatter and validator.':
      'Reguläre Ausdrücke mit Live-Hervorhebung testen, plus JSON-Formatierer und -Validator.',
    'Instant offline conversions for length, weight, temperature, and data storage.':
      'Sofortige Offline-Umrechnungen für Länge, Gewicht, Temperatur und Datenmengen.',
    'Color picker, tint and shade palette generator, and WCAG contrast checking.':
      'Farbwähler, Paletten-Generator und WCAG-Kontrastprüfung.',
    'Media Compressor': 'Medienkompressor',
    'Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.':
      'Video und Audio lokal zuschneiden und zu WebM umwandeln — ohne Uploads oder Server.',
    'Checksum Calculator': 'Prüfsummen-Rechner',
    'SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.':
      'SHA-256-, SHA-1- und MD5-Hashes im Speicher berechnet, mit Vergleich.',
    'Strip comments, editor metadata, and empty attributes from SVG markup.':
      'Entfernt Kommentare, Editor-Metadaten und leere Attribute aus SVG-Markup.',
    'Text Diff Checker': 'Textvergleich',
    'Side-by-side line-by-line diff with red/green highlighting, computed locally.':
      'Zeilenweiser Vergleich mit Rot/Grün-Markierung, lokal berechnet.',
    'Expense Tracker': 'Ausgaben-Tracker',
    'Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.':
      'Belege fotografieren, Details in deiner Landeswährung erfassen und als Excel-Mappe exportieren.',
    'More tools coming soon': 'Bald mehr Tools',
    'Open tool': 'Tool öffnen',
    'Buy me a coffee': 'Spendier mir einen Kaffee',
    '100% Client-Side & Private · Zero Server Tracking · TOG Utilities':
      '100 % lokal & privat · Kein Server-Tracking · TOG Utilities',
    'Installable PWA — works offline': 'Installierbare PWA — funktioniert offline',
    'Add to Home Screen': 'Zum Startbildschirm hinzufügen',
    'On mobile: browser menu → "Add to Home Screen". On desktop: install icon in the address bar.':
      'Mobil: Browser-Menü → „Zum Startbildschirm hinzufügen“. Desktop: Installations-Symbol in der Adressleiste.',
    'Share': 'Teilen',
    'Shared': 'Geteilt',
    'Saved': 'Gespeichert',
    'Copied!': 'Kopiert!',
    'Export backup': 'Backup exportieren',
    'Restore backup': 'Backup wiederherstellen',
    'Clear data': 'Daten löschen',
    'Last backup': 'Letztes Backup',
    'never': 'nie',
    'Storage': 'Speicher',
    'Backup files contain authenticator secrets — store them safely':
      'Backup-Dateien enthalten deine Authenticator-Geheimnisse — bewahre sie sicher auf',
    'Restore this backup? It replaces ALL current app data (notes, expenses, authenticator accounts, theme) with the file contents.':
      'Dieses Backup wiederherstellen? Es ersetzt ALLE aktuellen App-Daten (Notizen, Ausgaben, Authenticator-Konten, Theme) durch den Dateiinhalt.',
    'Backup restored. The app will now reload.': 'Backup wiederhergestellt. Die App wird jetzt neu geladen.',
    'Clear all app data on this device? This cannot be undone.':
      'Alle App-Daten auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.',
    'Really clear everything? Export a backup first if you need one.':
      'Wirklich alles löschen? Exportiere vorher ein Backup, falls du eines brauchst.',
    'Documents & Data': 'Dokumente & Daten',
    'Developer & Code': 'Entwicklung & Code',
    'Media & Design': 'Medien & Design',
    'Math, Time & Conversion': 'Mathe, Zeit & Umrechnung',
    'Scanners & Codes': 'Scanner & Codes',
    'Security & Finance': 'Sicherheit & Finanzen',
    'Audio & Misc': 'Audio & Sonstiges',
    'SQL Sandbox': 'SQL-Sandbox',
    'Currency': 'Währung',
    'Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.':
      'SQL-Abfragen in einer echten SQLite-Engine per WebAssembly ausführen — Schema ansehen, .sqlite-Dateien im- und exportieren.',
    'Reorder tools': 'Werkzeuge neu anordnen',
    'Done': 'Fertig',
    'Favorites': 'Favoriten',
    'Add to favorites': 'Zu Favoriten hinzufügen',
    'Remove from favorites': 'Aus Favoriten entfernen',
    'Move up': 'Nach oben',
    'Move down': 'Nach unten',
    'Report a Bug': 'Fehler melden',
    'Found a Bug?': 'Einen Fehler gefunden?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. There is no corporate support desk, and I don\'t have the time or energy to answer individual support emails.':
      'Diese Werkzeugsammlung wird vollständig von einem 76-jährigen unabhängigen Entwickler entwickelt und gepflegt, der auf einem Gehöft lebt. Es gibt keinen Firmen-Support, und ich habe weder Zeit noch Energie, einzelne Support-E-Mails zu beantworten.',
    'However, if you spot a bug or broken feature, let me know anyway! I regularly update and patch the app, so your bug reports go straight into the fix queue for the next update.':
      'Wenn Sie aber einen Fehler oder eine defekte Funktion entdecken, lassen Sie es mich trotzdem wissen! Ich aktualisiere und verbessere die App regelmäßig, sodass Ihre Fehlermeldungen direkt in der Fehlerbehebungsliste für das nächste Update landen.',
    'Copy diagnostics': 'Diagnose kopieren',
    'Copies anonymous technical details (browser, storage usage) — no personal data.':
      'Kopiert anonyme technische Details (Browser, Speichernutzung) — keine persönlichen Daten.',
    'Open GitHub issues': 'GitHub-Issues öffnen',
    'Close': 'Schließen',
    'Language': 'Sprache',
    'Auto': 'Auto',
    'Suggest a Feature': 'Funktion vorschlagen',
    'Have a Feature Idea?': 'Eine Idee für eine Funktion?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. I only build tools that I personally find useful or enjoy crafting, so I can\'t promise to build every suggestion.':
      'Diese Werkzeugsammlung wird vollständig von einem 76-jährigen unabhängigen Entwickler entwickelt und gepflegt, der auf einem Gehöft lebt. Ich baue nur Werkzeuge, die ich persönlich nützlich finde oder gerne entwickle — ich kann also nicht versprechen, jeden Vorschlag umzusetzen.',
    'However, if you have a brilliant idea for a lightweight, offline-first tool, share it anyway! If it tickles my curiosity, it just might show up in a future update.':
      'Wenn Sie aber eine brillante Idee für ein leichtgewichtiges Offline-Werkzeug haben, teilen Sie sie trotzdem! Wenn sie meine Neugier weckt, taucht sie vielleicht in einem nächsten Update auf.',
    'Describe your idea…': 'Beschreiben Sie Ihre Idee…',
    'Copy idea details': 'Idee kopieren',
    'Your idea is copied — paste it into a GitHub issue or anywhere handy.':
      'Ihre Idee ist kopiert — fügen Sie sie in ein GitHub-Issue ein oder wo immer es passt.',
    'What\'s new in': 'Neu in',
    'What\'s new': 'Neu',
    'Take Tour': 'Tour starten',
    'Dismiss': 'Ausblenden',
    'Dashboard Customization': 'Dashboard-Anpassung',
    'Pin your favorite tools and reorder the dashboard cards — your layout is saved on this device.':
      'Heften Sie Lieblingstools an und ordnen Sie die Dashboard-Karten neu — Ihre Anordnung wird auf diesem Gerät gespeichert.',
    'Global Feedback': 'Feedback überall',
    'Report a bug or suggest a feature from the footer links on any page — they go straight to the fix queue.':
      'Melden Sie einen Fehler oder schlagen Sie eine Funktion über die Fußzeilen-Links auf jeder Seite vor — sie landen direkt in der Fehlerbehebungsliste.',
    'Private by design': 'Privat per Design',
    'Look for the "Saved locally" badge — everything you enter stays on this device, in your browser.':
      'Achten Sie auf das „Saved locally"-Abzeichen — alles, was Sie eingeben, bleibt auf diesem Gerät, in Ihrem Browser.',
    'Don\'t show update announcements in the future': 'Ankündigungen zu neuen Funktionen künftig nicht anzeigen',
    'Next': 'Weiter',
    'Back': 'Zurück',
    'Settings': 'Einstellungen',
    'Preferences': 'Präferenzen',
    'Show feature update announcements': 'Ankündigungen zu neuen Funktionen anzeigen',
  },
  nl: {
    'All Tools': 'Alle tools',
    'PDF Tools': 'PDF-tools',
    'QR Scanner': 'QR-scanner',
    'Excel & CSV': 'Excel & CSV',
    'Notebook': 'Notitieboek',
    'Voice Tools': 'Spraaktools',
    'Passwords': 'Wachtwoorden',
    'Image Optimizer': 'Afbeelding-optimalisatie',
    'Regex & JSON': 'Regex & JSON',
    'Unit Converter': 'Eenhedenconverter',
    'Color Tools': 'Kleurtools',
    'Media Tools': 'Mediatools',
    'Checksums': 'Checksums',
    'SVG Optimizer': 'SVG-optimalisatie',
    'Diff Checker': 'Tekstvergelijker',
    'Expenses': 'Uitgaven',
    'Text Tools': 'Teksttools',
    'Calc & Time': 'Rekenen & tijd',
    'Text Workbench': 'Tekstwerkbank',
    'Case conversion, line sorting and dedupe, word counts, and lorem ipsum generation.': 'Hoofdletterconversie, regels sorteren en dedupliceren, woordtelling en lorem ipsum.',
    'Calc & Time Converter': 'Reken- en tijdzoner converter',
    'Percentages, VAT, and timezone conversion — formatted for your device locale.': 'Percentages, btw en tijdzoneconversie — geformatteerd voor je regio.',
    'What do you need today?': 'Wat heb je vandaag nodig?',
    'A growing collection of everyday utilities that run entirely in your browser — no uploads, no accounts, works offline once installed.':
      'Een groeiende verzameling dagelijkse hulpprogramma’s die volledig in je browser draaien — geen uploads, geen accounts, werkt offline na installatie.',
    'PDF Reader & Converter': 'PDF-lezer & -converter',
    'Open, read, and convert PDF documents right on your device. Files never leave your machine.':
      'Open, lees en converteer PDF-documenten op je apparaat. Bestanden verlaten je machine nooit.',
    'QR Code Scanner': 'QR-code scanner',
    'Point your camera at a QR code to instantly read links, Wi-Fi credentials, and more.':
      'Richt je camera op een QR-code om direct links, wifi-gegevens en meer te lezen.',
    'Excel & CSV Converter': 'Excel- & CSV-converter',
    'Preview spreadsheets, export sheets to PDF or CSV, and compile CSV files into a workbook.':
      'Bekijk spreadsheets, exporteer bladen naar PDF of CSV en maak van CSV-bestanden een werkmap.',
    'Markdown Notebook': 'Markdown-notitieboek',
    'Distraction-free notes with live preview and auto-save. Export to Markdown, HTML, or PDF.':
      'Afleidingsvrije notities met live voorbeeld en automatisch opslaan. Exporteer naar Markdown, HTML of PDF.',
    'Dictate text with speech-to-text, or have any text read aloud with text-to-speech.':
      'Dicteer tekst met spraakherkenning of laat tekst hardop voorlezen.',
    'Password Generator': 'Wachtwoordgenerator',
    'Cryptographically random passphrases and complex passwords with a live entropy meter.':
      'Cryptografisch willekeurige wachtwoordzinnen en complexe wachtwoorden met live entropiemeter.',
    'Resize, compress, and convert images to WebP or JPEG — EXIF data stripped automatically.':
      'Afbeeldingen schalen, comprimeren en converteren naar WebP of JPEG — EXIF-gegevens worden automatisch verwijderd.',
    'Regex & JSON Playground': 'Regex- & JSON-speeltuin',
    'Test regular expressions with live match highlighting, plus a JSON formatter and validator.':
      'Test reguliere expressies met live markering, plus een JSON-formatter en -validator.',
    'Instant offline conversions for length, weight, temperature, and data storage.':
      'Directe offline conversies voor lengte, gewicht, temperatuur en gegevens.',
    'Color picker, tint and shade palette generator, and WCAG contrast checking.':
      'Kleurenkiezer, tint- en schaduwgenerator en WCAG-contrastcontrole.',
    'Media Compressor': 'Mediacompressor',
    'Trim and re-encode video and audio locally to WebM — no uploads, no ffmpeg server.':
      'Knip en hercodeer video en audio lokaal naar WebM — geen uploads, geen server.',
    'Checksum Calculator': 'Checksum-calculator',
    'SHA-256, SHA-1, and MD5 file hashes computed in-memory, with hash comparison.':
      'SHA-256-, SHA-1- en MD5-hashes berekend in het geheugen, met vergelijking.',
    'Strip comments, editor metadata, and empty attributes from SVG markup.':
      'Verwijder commentaar, editor-metadata en lege attributen uit SVG-code.',
    'Text Diff Checker': 'Tekstvergelijker',
    'Side-by-side line-by-line diff with red/green highlighting, computed locally.':
      'Regel-voor-regel vergelijking met rood/groen-markering, lokaal berekend.',
    'Expense Tracker': 'Uitgaven-tracker',
    'Snap receipts, log vendor/date/amount in your local currency, export an Excel workbook.':
      'Fotografeer bonnen, registreer gegevens in je lokale valuta en exporteer een Excel-werkmap.',
    'More tools coming soon': 'Binnenkort meer tools',
    'Open tool': 'Tool openen',
    'Buy me a coffee': 'Trakteer me op een koffie',
    '100% Client-Side & Private · Zero Server Tracking · TOG Utilities':
      '100% lokaal & privé · Nul server-tracking · TOG Utilities',
    'Installable PWA — works offline': 'Installeerbare PWA — werkt offline',
    'Add to Home Screen': 'Toevoegen aan beginscherm',
    'On mobile: browser menu → "Add to Home Screen". On desktop: install icon in the address bar.':
      'Mobiel: browsermenu → "Toevoegen aan beginscherm". Desktop: installatiepictogram in de adresbalk.',
    'Share': 'Delen',
    'Shared': 'Gedeeld',
    'Saved': 'Opgeslagen',
    'Copied!': 'Gekopieerd!',
    'Export backup': 'Back-up exporteren',
    'Restore backup': 'Back-up herstellen',
    'Clear data': 'Gegevens wissen',
    'Last backup': 'Laatste back-up',
    'never': 'nooit',
    'Storage': 'Opslag',
    'Backup files contain authenticator secrets — store them safely':
      'Back-upbestanden bevatten je authenticator-geheimen — bewaar ze veilig',
    'Restore this backup? It replaces ALL current app data (notes, expenses, authenticator accounts, theme) with the file contents.':
      'Deze back-up herstellen? Dit vervangt ALLE huidige app-gegevens (notities, uitgaven, authenticator-accounts, thema) door de inhoud van het bestand.',
    'Backup restored. The app will now reload.': 'Back-up hersteld. De app wordt nu herladen.',
    'Clear all app data on this device? This cannot be undone.':
      'Alle app-gegevens op dit apparaat wissen? Dit kan niet ongedaan worden gemaakt.',
    'Really clear everything? Export a backup first if you need one.':
      'Echt alles wissen? Exporteer eerst een back-up als je er een nodig hebt.',
    'Documents & Data': 'Documenten & data',
    'Developer & Code': 'Ontwikkeling & code',
    'Media & Design': 'Media & ontwerp',
    'Math, Time & Conversion': 'Wiskunde, tijd & conversie',
    'Scanners & Codes': 'Scanners & codes',
    'Security & Finance': 'Beveiliging & financiën',
    'Audio & Misc': 'Audio & diversen',
    'SQL Sandbox': 'SQL-sandbox',
    'Currency': 'Valuta',
    'Run SQL queries in a real SQLite engine via WebAssembly — inspect the schema, import and export .sqlite files.':
      'Voer SQL-query’s uit in een echte SQLite-engine via WebAssembly — inspecteer het schema, importeer en exporteer .sqlite-bestanden.',
    'Reorder tools': 'Tools herschikken',
    'Done': 'Klaar',
    'Favorites': 'Favorieten',
    'Add to favorites': 'Aan favorieten toevoegen',
    'Remove from favorites': 'Uit favorieten verwijderen',
    'Move up': 'Omhoog',
    'Move down': 'Omlaag',
    'Report a Bug': 'Meld een bug',
    'Found a Bug?': 'Een bug gevonden?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. There is no corporate support desk, and I don\'t have the time or energy to answer individual support emails.':
      'Deze utilities-suite is volledig gebouwd en wordt onderhouden door een 76-jarige onafhankelijke ontwikkelaar die op een hoeve woont. Er is geen zakelijke helpdesk en ik heb geen tijd of energie om individuele supportmails te beantwoorden.',
    'However, if you spot a bug or broken feature, let me know anyway! I regularly update and patch the app, so your bug reports go straight into the fix queue for the next update.':
      'Maar als je een bug of een kapotte functie ziet, laat het me toch weten! Ik werk de app regelmatig bij en repareer problemen, dus je bugrapporten komen direct in de fixlijst voor de volgende update.',
    'Copy diagnostics': 'Diagnose kopiëren',
    'Copies anonymous technical details (browser, storage usage) — no personal data.':
      'Kopieert anonieme technische gegevens (browser, opslaggebruik) — geen persoonlijke data.',
    'Open GitHub issues': 'GitHub-issues openen',
    'Close': 'Sluiten',
    'Language': 'Taal',
    'Auto': 'Auto',
    'Suggest a Feature': 'Stel een functie voor',
    'Have a Feature Idea?': 'Een idee voor een functie?',
    'This utility suite is built and maintained entirely by a 76-year-old independent developer living on a homestead. I only build tools that I personally find useful or enjoy crafting, so I can\'t promise to build every suggestion.':
      'Deze utilities-suite is volledig gebouwd en wordt onderhouden door een 76-jarige onafhankelijke ontwikkelaar die op een hoeve woont. Ik bouw alleen tools die ik zelf nuttig vind of leuk vind om te maken, dus ik kan niet beloven elke suggestie te bouwen.',
    'However, if you have a brilliant idea for a lightweight, offline-first tool, share it anyway! If it tickles my curiosity, it just might show up in a future update.':
      'Maar als je een briljant idee hebt voor een lichtgewicht, offline-first tool, deel het toch! Als het mijn nieuwsgierigheid prikkelt, verschijnt het misschien in een toekomstige update.',
    'Describe your idea…': 'Beschrijf je idee…',
    'Copy idea details': 'Kopieer het idee',
    'Your idea is copied — paste it into a GitHub issue or anywhere handy.':
      'Je idee is gekopieerd — plak het in een GitHub-issue of waar je maar wilt.',
    'What\'s new in': 'Nieuw in',
    'What\'s new': 'Nieuw',
    'Take Tour': 'Rondleiding',
    'Dismiss': 'Verbergen',
    'Dashboard Customization': 'Dashboard aanpassen',
    'Pin your favorite tools and reorder the dashboard cards — your layout is saved on this device.':
      'Pin favoriete tools en herschik de dashboardkaarten — je indeling wordt op dit apparaat bewaard.',
    'Global Feedback': 'Feedback overal',
    'Report a bug or suggest a feature from the footer links on any page — they go straight to the fix queue.':
      'Meld een bug of stel een functie voor via de links in de voettekst op elke pagina — ze komen direct in de fixlijst terecht.',
    'Private by design': 'Privé by design',
    'Look for the "Saved locally" badge — everything you enter stays on this device, in your browser.':
      'Let op de "Saved locally"-badge — alles wat je invoert blijft op dit apparaat, in je browser.',
    'Don\'t show update announcements in the future': 'Toon geen update-aankondigingen meer in de toekomst',
    'Next': 'Volgende',
    'Back': 'Terug',
    'Settings': 'Instellingen',
    'Preferences': 'Voorkeuren',
    'Show feature update announcements': 'Toon aankondigingen van nieuwe functies',
  },
}

export function t(english: string): string {
  if (LANG === 'en') return english
  return dicts[LANG][english] ?? english
}

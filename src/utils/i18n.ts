// Lightweight i18n: English source strings act as keys; per-language
// dictionaries override. Missing keys fall back to English automatically.
// Detection: first supported prefix in navigator.languages.
export type Lang = 'en' | 'bg' | 'es' | 'fr' | 'de' | 'nl'

const SUPPORTED: Lang[] = ['bg', 'es', 'fr', 'de', 'nl']

export const LANG: Lang = (() => {
  const prefs = navigator.languages ?? [navigator.language]
  for (const p of prefs) {
    const short = p.slice(0, 2).toLowerCase() as Lang
    if (SUPPORTED.includes(short)) return short
  }
  return 'en'
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
  },
}

export function t(english: string): string {
  if (LANG === 'en') return english
  return dicts[LANG][english] ?? english
}

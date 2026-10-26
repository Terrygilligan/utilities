const BLOCK_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,pre,blockquote'

const sanitize = (value: string) =>
  value.replace(/\s+/g, ' ').replace(/[^ -ÿ]/g, '').trim()

const sanitizePre = (value: string) =>
  value.replace(/\t/g, '  ').replace(/[^ -ÿ\n]/g, '')

export async function markdownToPdfBlob(html: string, title: string): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)

  const PAGE_W = 595
  const PAGE_H = 842
  const MARGIN = 48
  const usable = PAGE_W - MARGIN * 2

  interface Block {
    text: string
    size: number
    font: typeof regular
    gap: number
  }

  const blocks: Block[] = []
  const container = document.createElement('div')
  container.innerHTML = html

  container.querySelectorAll(BLOCK_SELECTOR).forEach((element) => {
    if (element.parentElement?.closest(BLOCK_SELECTOR)) return
    const tag = element.tagName.toLowerCase()
    if (tag === 'pre') {
      for (const line of sanitizePre(element.textContent ?? '').split('\n')) {
        blocks.push({ text: line, size: 8.5, font: mono, gap: 0 })
      }
      blocks.push({ text: '', size: 8.5, font: mono, gap: 6 })
      return
    }
    const preset = (() => {
      switch (tag) {
        case 'h1':
          return { size: 18, font: boldFont, gap: 10 }
        case 'h2':
          return { size: 14, font: boldFont, gap: 8 }
        case 'h3':
        case 'h4':
          return { size: 12, font: boldFont, gap: 7 }
        case 'h5':
        case 'h6':
          return { size: 10.5, font: boldFont, gap: 6 }
        case 'li':
          return { size: 9.5, font: regular, gap: 2, prefix: '•  ' }
        default:
          return { size: 9.5, font: regular, gap: 6, prefix: '' }
      }
    })()
    const text = sanitize(`${'prefix' in preset ? preset.prefix : ''}${element.textContent ?? ''}`)
    blocks.push({ text, size: preset.size, font: preset.font, gap: preset.gap })
  })

  const wrap = (text: string, font: typeof regular, size: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= usable) {
        line = candidate
        continue
      }
      if (line) lines.push(line)
      let chunk = word
      while (font.widthOfTextAtSize(chunk, size) > usable && chunk.length > 1) {
        let cut = chunk.length
        while (cut > 1 && font.widthOfTextAtSize(chunk.slice(0, cut), size) > usable) cut--
        lines.push(chunk.slice(0, cut))
        chunk = chunk.slice(cut)
      }
      line = chunk
    }
    if (line) lines.push(line)
    return lines
  }

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  if (title) {
    page.drawText(sanitize(title), {
      x: MARGIN,
      y: y - 14,
      size: 14,
      font: boldFont,
      color: rgb(0.05, 0.09, 0.16),
    })
    y -= 30
  }

  for (const block of blocks) {
    if (!block.text) {
      y -= block.gap + 6
      continue
    }
    const lines = wrap(block.text, block.font, block.size)
    const lineHeight = block.size * 1.35
    if (y - (lines.length * lineHeight + block.gap) < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
    }
    y -= block.gap
    for (const line of lines) {
      if (y - lineHeight < MARGIN) {
        page = doc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
      }
      page.drawText(line, {
        x: MARGIN,
        y: y - block.size,
        size: block.size,
        font: block.font,
        color: rgb(0.12, 0.16, 0.24),
      })
      y -= lineHeight
    }
  }

  return new Blob([(await doc.save()).slice()], { type: 'application/pdf' })
}

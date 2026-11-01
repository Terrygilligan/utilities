import type { PDFDocument, PDFPage } from 'pdf-lib'
import type { EditState, Pt } from './editTypes'
import { drawAnnotation } from './AnnotationLayer'

const OVERLAY_SCALE = 2

export interface ExportResult {
  blob: Blob
  warnings: string[]
}

// Maps a normalized point in the displayed (rotated) view back into the
// page's unrotated coordinate frame, then to canvas pixels.
function makeProjector(totalRot: number, w: number, h: number) {
  return (p: Pt): Pt => {
    let u: number
    let v: number
    switch (totalRot) {
      case 90:
        u = p.y
        v = 1 - p.x
        break
      case 180:
        u = 1 - p.x
        v = 1 - p.y
        break
      case 270:
        u = 1 - p.y
        v = p.x
        break
      default:
        u = p.x
        v = p.y
    }
    return { x: u * w, y: v * h }
  }
}

export async function buildEditedPdf(file: File, edit: EditState): Promise<ExportResult> {
  const {
    PDFDocument,
    PDFTextField,
    PDFCheckBox,
    PDFRadioGroup,
    PDFDropdown,
    PDFOptionList,
    degrees,
  } = await import('pdf-lib')

  const src = await PDFDocument.load(await file.arrayBuffer())
  const warnings: string[] = []

  let hasFields = false
  try {
    const form = src.getForm()
    hasFields = form.getFields().length > 0
    let applied = 0
    for (const field of form.getFields()) {
      const value = edit.formValues[field.getName()]
      if (value === undefined) continue
      if (field instanceof PDFTextField) field.setText(value)
      else if (field instanceof PDFCheckBox) value === 'true' ? field.check() : field.uncheck()
      else if (field instanceof PDFRadioGroup) value && field.select(value)
      else if (field instanceof PDFDropdown) value && field.select(value)
      else if (field instanceof PDFOptionList) value && field.select(value)
      else continue
      applied++
    }
    if (applied > 0) {
      try {
        form.updateFieldAppearances()
      } catch {
        warnings.push(
          'Some filled values could not be redrawn — they are still stored in the fields and will display when the field is tapped in a viewer.',
        )
      }
    }
  } catch {
    // no readable AcroForm — annotations and page ops still apply
  }

  const kept = edit.pages.filter((p) => !p.deleted)
  const orderChanged =
    kept.length !== edit.pages.length || edit.pages.some((p, i) => p.src !== i + 1)

  let out: PDFDocument
  let outPages: PDFPage[]
  if (orderChanged) {
    if (hasFields) {
      warnings.push(
        'Reordering or deleting pages rebuilds the PDF — form fields lose their interactivity in the exported copy (filled values remain visible).',
      )
    }
    out = await PDFDocument.create()
    outPages = await out.copyPages(src, kept.map((p) => p.src - 1))
    outPages.forEach((page) => out.addPage(page))
  } else {
    out = src
    outPages = out.getPages()
  }

  kept.forEach((entry, i) => {
    if (entry.rot === 0) return
    const page = outPages[i]
    page.setRotation(degrees((page.getRotation().angle + entry.rot) % 360))
  })

  for (let i = 0; i < kept.length; i++) {
    const list = edit.annotations[kept[i].src]
    if (!list || list.length === 0) continue
    const page = outPages[i]
    const W = page.getWidth()
    const H = page.getHeight()
    const totalRot = ((page.getRotation().angle % 360) + 360) % 360
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(W * OVERLAY_SCALE))
    canvas.height = Math.max(1, Math.round(H * OVERLAY_SCALE))
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    const project = makeProjector(totalRot, canvas.width, canvas.height)
    const basisW = (totalRot === 90 || totalRot === 270 ? H : W) * OVERLAY_SCALE
    const textRotation = (-totalRot * Math.PI) / 180
    for (const a of list) drawAnnotation(ctx, a, project, basisW, textRotation)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) continue
    const png = await out.embedPng(await blob.arrayBuffer())
    page.drawImage(png, { x: 0, y: 0, width: W, height: H })
  }

  const bytes = await out.save()
  return { blob: new Blob([bytes.slice()], { type: 'application/pdf' }), warnings }
}

export const preprocess = (file: File): Promise<HTMLCanvasElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      const scale = Math.min(3, Math.max(1, 2000 / Math.max(img.width, img.height)))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('no 2d context'))
      ctx.filter = 'grayscale(1) contrast(1.4)'
      ctx.drawImage(img, 0, 0, c.width, c.height)
      const d = ctx.getImageData(0, 0, c.width, c.height)
      const px = d.data
      let min = 255
      let max = 0
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] < min) min = px[i]
        if (px[i] > max) max = px[i]
      }
      const range = Math.max(1, max - min)
      for (let i = 0; i < px.length; i += 4) {
        const v = Math.round(((px[i] - min) / range) * 255)
        px[i] = px[i + 1] = px[i + 2] = v
      }
      ctx.putImageData(d, 0, 0)
      resolve(c)
    }
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = URL.createObjectURL(file)
  })

export async function ocrImageFile(file: File, langs = ['eng', 'bul']): Promise<string> {
  const mod = await import('tesseract.js')
  const api = 'createWorker' in mod ? mod : (mod as { default?: typeof mod }).default
  if (!api) throw new Error('tesseract.js module shape not recognized')
  const worker = await api.createWorker(langs, undefined, {
    workerPath: '/tess-worker/worker.min.js',
    corePath: '/tess-worker/tesseract-core-simd-lstm.wasm.js',
    langPath: '/tessdata',
  })
  try {
    await worker.setParameters({ tessedit_pageseg_mode: api.PSM.SPARSE_TEXT })
    const { data } = await worker.recognize(await preprocess(file))
    return data.text
  } finally {
    await worker.terminate()
  }
}

const SIGNATURE_KEY = 'utility-hub.signature.png'

export function loadSignature(): string | null {
  try {
    return localStorage.getItem(SIGNATURE_KEY)
  } catch {
    return null
  }
}

export function saveSignature(dataUrl: string) {
  try {
    localStorage.setItem(SIGNATURE_KEY, dataUrl)
  } catch {
    // storage unavailable — signature just won't persist
  }
}

export function clearSignature() {
  try {
    localStorage.removeItem(SIGNATURE_KEY)
  } catch {
    // storage unavailable
  }
}

// Decoded-image cache so canvas drawing stays synchronous: preloads happen
// once (export / first render), drawAnnotation then just looks the image up.
const imageCache = new Map<string, HTMLImageElement>()

export function preloadSignatureImage(dataUrl: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(dataUrl)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(dataUrl, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error('signature image failed to decode'))
    img.src = dataUrl
  })
}

export function getSignatureImage(dataUrl: string): HTMLImageElement | null {
  return imageCache.get(dataUrl) ?? null
}

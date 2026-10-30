import type { FirebaseApp } from '@firebase/app'

const firebaseConfig = {
  apiKey: 'AIzaSyAG5q5kRQH6mhUNQs38zdBpT0gdiX5dMNs',
  authDomain: 'farmfresh-5e95e.firebaseapp.com',
  projectId: 'farmfresh-5e95e',
  storageBucket: 'farmfresh-5e95e.firebasestorage.app',
  messagingSenderId: '417426820258',
  appId: '1:417426820258:web:3b1406d7872546916f9bfb',
  measurementId: 'G-262C3517H3',
}

let appPromise: Promise<FirebaseApp> | null = null

// App Check (reCAPTCHA Enterprise) — deferred to idle so the ~160KB bundle
// never blocks render. Inert until enforcement is enabled in the Firebase
// console → App Check; feedback writes still work either way.
const APPCHECK_SITE_KEY = '6Le8sxotAAAAAMtXi1w6zoGwCE3r6bGFKh3Phf-G'
let appCheckStarted = false
const startAppCheck = (app: FirebaseApp) => {
  if (appCheckStarted) return
  appCheckStarted = true
  const init = () =>
    import('@firebase/app-check')
      .then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
        try {
          initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY),
            isTokenAutoRefreshEnabled: true,
          })
        } catch {
          // already initialized
        }
      })
      .catch(() => {})
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(init, { timeout: 5000 })
  } else {
    setTimeout(init, 3000)
  }
}

export function getFirebaseApp(): Promise<FirebaseApp> {
  appPromise ??= import('@firebase/app').then(({ getApp, getApps, initializeApp }) => {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    startAppCheck(app)
    return app
  })
  return appPromise
}

export function initAnalytics() {
  if (import.meta.env.DEV) return
  void (async () => {
    try {
      const [{ getAnalytics, isSupported }, app] = await Promise.all([
        import('@firebase/analytics'),
        getFirebaseApp(),
      ])
      if (await isSupported()) getAnalytics(app)
    } catch {
      // best-effort only — analytics must never break the app
    }
  })()
}

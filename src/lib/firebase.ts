const firebaseConfig = {
  apiKey: 'AIzaSyAG5q5kRQH6mhUNQs38zdBpT0gdiX5dMNs',
  authDomain: 'farmfresh-5e95e.firebaseapp.com',
  projectId: 'farmfresh-5e95e',
  storageBucket: 'farmfresh-5e95e.firebasestorage.app',
  messagingSenderId: '417426820258',
  appId: '1:417426820258:web:3b1406d7872546916f9bfb',
  measurementId: 'G-262C3517H3',
}

export function initAnalytics() {
  if (import.meta.env.DEV) return
  void (async () => {
    try {
      const [{ initializeApp }, { getAnalytics, isSupported }] = await Promise.all([
        import('@firebase/app'),
        import('@firebase/analytics'),
      ])
      const app = initializeApp(firebaseConfig)
      if (await isSupported()) getAnalytics(app)
    } catch {
      // best-effort only — analytics must never break the app
    }
  })()
}

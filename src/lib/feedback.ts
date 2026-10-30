// Anonymous bug/feature reports — write-only `feedback_reports` collection on
// the shared farmfresh project. No account needed; reports aren't publicly
// readable (rules deny read). Games Hub writes the same collection with
// app: 'games-hub'.
import { getFirebaseApp } from './firebase'

const COLLECTION = 'feedback_reports'

export type ReportType = 'bug' | 'feature'

export async function submitReport(type: ReportType, message: string): Promise<boolean> {
  const app = await getFirebaseApp()
  if (!app) return false
  const text = message.trim().slice(0, 2000)
  if (!text) return false
  try {
    const { getFirestore, addDoc, collection, serverTimestamp } = await import(
      '@firebase/firestore'
    )
    await addDoc(collection(getFirestore(app), COLLECTION), {
      type,
      message: text,
      url: window.location.href.slice(0, 500),
      userAgent: navigator.userAgent.slice(0, 500),
      lang: navigator.language.slice(0, 32),
      app: 'utility-hub',
      createdAt: serverTimestamp(),
    })
    return true
  } catch {
    return false
  }
}

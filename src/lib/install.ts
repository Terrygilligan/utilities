import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null

export function useInstallPrompt(): [boolean, () => Promise<void>] {
  const [available, setAvailable] = useState(deferred !== null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferred = e as BeforeInstallPromptEvent
      setAvailable(true)
    }
    const onInstalled = () => {
      deferred = null
      setAvailable(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    deferred = null
    setAvailable(false)
  }

  return [available, install]
}

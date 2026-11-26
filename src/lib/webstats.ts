// Cloudflare Web Analytics — cookieless, no personal data (no cookies, no
// fingerprinting, no IPs stored client-side). Guards skip the beacon for
// bots, automation, DNT/GPC, and per-device opt-out.
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js'
const BEACON_TOKEN = 'ef31e4d02a8d438cb82853d9108c49d8'
const OPTOUT_KEY = 'utility-hub.stats-opt-out'

const BOT_UA =
  /bot|crawler|spider|headless|lighthouse|pingdom|uptime|monitor|scrap|curl|wget|python-requests|httpclient|preview|facebookexternalhit|slackbot|discordbot|whatsapp|linkedinbot|phantom|puppeteer|playwright|selenium/i

export function statsOptedOut(): boolean {
  try {
    return localStorage.getItem(OPTOUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setStatsOptedOut(out: boolean) {
  try {
    if (out) localStorage.setItem(OPTOUT_KEY, '1')
    else localStorage.removeItem(OPTOUT_KEY)
  } catch {
    // storage unavailable
  }
}

export function initWebStats() {
  if (import.meta.env.DEV || !BEACON_TOKEN) return
  const nav = navigator as Navigator & {
    webdriver?: boolean
    globalPrivacyControl?: boolean
    doNotTrack?: string | null
  }
  if (nav.webdriver || BOT_UA.test(nav.userAgent)) return
  if (nav.globalPrivacyControl || nav.doNotTrack === '1' || statsOptedOut()) return

  const script = document.createElement('script')
  script.defer = true
  script.src = BEACON_SRC
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: BEACON_TOKEN }))
  document.head.appendChild(script)
}

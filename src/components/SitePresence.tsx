import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const storageKey = 'dra_andressa_site_session_v27'

function getSessionId() {
  try {
    const saved = window.sessionStorage.getItem(storageKey)
    if (saved && saved.length >= 8) return saved

    const value =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`

    window.sessionStorage.setItem(storageKey, value)
    return value
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

async function ping(pathname: string) {
  if (!supabaseUrl || !publishableKey) return

  try {
    await fetch(`${supabaseUrl}/rest/v1/rpc/site_presence_ping_v27`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      body: JSON.stringify({
        p_session_id: getSessionId(),
        p_path: pathname,
        p_referrer: document.referrer || null,
      }),
    })
  } catch {
    // Métrica nunca deve interferir na navegação do paciente.
  }
}

export default function SitePresence() {
  const location = useLocation()

  useEffect(() => {
    void ping(`${location.pathname}${location.search}`)

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void ping(`${window.location.pathname}${window.location.search}`)
      }
    }, 60_000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void ping(`${window.location.pathname}${window.location.search}`)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [location.pathname, location.search])

  return null
}

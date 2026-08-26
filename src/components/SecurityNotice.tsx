import { useEffect, useRef, useState } from 'react'
import { ShieldAlert } from 'lucide-react'

const DEVTOOLS_THRESHOLD = 180

export default function SecurityNotice() {
  const [open, setOpen] = useState(false)
  const [devToolsDetected, setDevToolsDetected] = useState(false)
  const manualTimer = useRef<number | null>(null)

  useEffect(() => {
    const showManualWarning = () => {
      setOpen(true)

      if (manualTimer.current) {
        window.clearTimeout(manualTimer.current)
      }

      manualTimer.current = window.setTimeout(() => {
        if (!devToolsDetected) {
          setOpen(false)
        }
      }, 7000)
    }

    const keyboardHandler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const ctrlOrMeta = event.ctrlKey || event.metaKey

      const blocked =
        event.key === 'F12' ||
        (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (ctrlOrMeta && key === 'u')

      if (!blocked) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      showManualWarning()
    }

    const detectDevTools = () => {
      const widthDifference =
        Math.max(0, window.outerWidth - window.innerWidth)

      const heightDifference =
        Math.max(0, window.outerHeight - window.innerHeight)

      const detected =
        widthDifference > DEVTOOLS_THRESHOLD ||
        heightDifference > DEVTOOLS_THRESHOLD

      setDevToolsDetected(detected)

      if (detected) {
        setOpen(true)
      } else if (!manualTimer.current) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', keyboardHandler, true)
    document.addEventListener('keydown', keyboardHandler, true)

    window.addEventListener('resize', detectDevTools)
    window.addEventListener('focus', detectDevTools)

    detectDevTools()

    const interval =
      window.setInterval(detectDevTools, 800)

    return () => {
      window.removeEventListener('keydown', keyboardHandler, true)
      document.removeEventListener('keydown', keyboardHandler, true)
      window.removeEventListener('resize', detectDevTools)
      window.removeEventListener('focus', detectDevTools)

      window.clearInterval(interval)

      if (manualTimer.current) {
        window.clearTimeout(manualTimer.current)
      }
    }
  }, [devToolsDetected])

  useEffect(() => {
    if (!open) {
      document.documentElement.classList.remove('restricted-access-active')
      return
    }

    document.documentElement.classList.add('restricted-access-active')

    return () => {
      document.documentElement.classList.remove('restricted-access-active')
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="security-block-screen"
      role="alertdialog"
      aria-modal="true"
      aria-label="Acesso restrito à instituição"
    >
      <section className="security-block-card">
        <div className="security-block-icon">
          <ShieldAlert size={34} />
        </div>

        <span className="security-block-eyebrow">
          ÁREA PROTEGIDA
        </span>

        <h2>Acesso restrito à empresa</h2>

        <p>
          O acesso às ferramentas técnicas deste ambiente é destinado
          exclusivamente à equipe autorizada da instituição.
        </p>

        <div className="security-block-status">
          {devToolsDetected
            ? 'Feche as ferramentas de desenvolvedor para continuar navegando.'
            : 'A tentativa de acesso técnico foi bloqueada pelo site.'}
        </div>

        {!devToolsDetected && (
          <button
            type="button"
            className="button button-primary security-block-button"
            onClick={() => {
              if (manualTimer.current) {
                window.clearTimeout(manualTimer.current)
                manualTimer.current = null
              }

              setOpen(false)
            }}
          >
            Voltar ao site
          </button>
        )}
      </section>
    </div>
  )
}

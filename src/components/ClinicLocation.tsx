import { useState } from 'react'
import {
  MapPin,
  Navigation,
  CarFront,
  ExternalLink,
  X,
  Copy,
  Check,
  Map,
} from 'lucide-react'

import '../styles/clinic-location.css'

const CLINIC_NAME = 'Clínica Dra. Andressa Dallarmi'

const ADDRESS =
  'R. Baltazar Carrasco dos Reis, 2843 - Água Verde, Curitiba - PR, 80250-130'

const MAP_SHARE =
  'https:' + '//maps.app.goo.gl/YFUNRxhQRDBcyZkk9'

const GOOGLE_DIRECTIONS =
  'https:' +
  '//www.google.com/maps/dir/?api=1&destination=' +
  encodeURIComponent(ADDRESS) +
  '&travelmode=driving&dir_action=navigate'

const WAZE =
  'https:' +
  '//waze.com/ul?q=' +
  encodeURIComponent(ADDRESS) +
  '&navigate=yes'

const UBER =
  'https:' + '//m.uber.com/'

const NINETYNINE =
  'https:' + '//99app.com/'

const MAP_EMBED =
  'https:' +
  '//www.google.com/maps?q=' +
  encodeURIComponent(ADDRESS) +
  '&output=embed'

export default function ClinicLocation() {
  const [transportOpen, setTransportOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function showCopied() {
    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 2400)
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(ADDRESS)
      showCopied()
    } catch {
      window.prompt('Copie o endereço da clínica:', ADDRESS)
    }
  }

  function openRideService(url: string) {
    /*
      Uber e 99:
      abre o serviço e copia o destino para a área de transferência.
      Assim não usamos deeplinks não documentados ou instáveis.
    */
    window.open(url, '_blank', 'noopener,noreferrer')

    navigator.clipboard
      ?.writeText(ADDRESS)
      .then(showCopied)
      .catch(() => undefined)
  }

  return (
    <>
      <section className="clinic-location-section" aria-labelledby="clinic-location-title">
        <div className="clinic-location-shell">
          <div className="clinic-location-heading">
            <div>
              <span className="clinic-location-eyebrow">
                <MapPin size={14} />
                Localização
              </span>

              <h2 id="clinic-location-title">
                Estamos no Água Verde,
                <br />
                em Curitiba.
              </h2>
            </div>

            <p>
              Consulte a localização da clínica, trace sua rota ou escolha
              como prefere chegar ao atendimento.
            </p>
          </div>

          <div className="clinic-location-grid">
            <div className="clinic-map-card">
              <iframe
                src={MAP_EMBED}
                title="Mapa da Clínica Dra. Andressa Dallarmi"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />

              <a
                className="clinic-map-expand"
                href={MAP_SHARE}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={15} />
                Abrir mapa
              </a>
            </div>

            <div className="clinic-location-info">
              <span className="clinic-location-mini-label">
                Onde atendemos
              </span>

              <h3>{CLINIC_NAME}</h3>

              <div className="clinic-address">
                <MapPin size={20} />
                <div>
                  <strong>Água Verde • Curitiba</strong>
                  <span>{ADDRESS}</span>
                </div>
              </div>

              <div className="clinic-location-actions">
                <a
                  className="clinic-location-button clinic-location-button-primary"
                  href={GOOGLE_DIRECTIONS}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={18} />
                  Como chegar
                </a>

                <button
                  type="button"
                  className="clinic-location-button clinic-location-button-secondary"
                  onClick={() => setTransportOpen(true)}
                >
                  <CarFront size={18} />
                  Carro por aplicativo
                </button>
              </div>

              <button
                type="button"
                className="clinic-copy-address"
                onClick={copyAddress}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}

                {copied ? 'Endereço copiado' : 'Copiar endereço'}
              </button>

              <div className="clinic-location-note">
                <Map size={15} />
                <span>
                  A rota utiliza sua localização atual quando disponível no
                  aparelho.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {transportOpen && (
        <div
          className="transport-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setTransportOpen(false)
            }
          }}
        >
          <div
            className="transport-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transport-modal-title"
          >
            <button
              type="button"
              className="transport-modal-close"
              aria-label="Fechar"
              onClick={() => setTransportOpen(false)}
            >
              <X size={20} />
            </button>

            <span className="transport-modal-eyebrow">
              Como deseja chegar?
            </span>

            <h3 id="transport-modal-title">
              Escolha uma opção
            </h3>

            <p>
              O destino é a Clínica Dra. Andressa Dallarmi, no Água Verde.
            </p>

            <div className="transport-options">
              <a
                href={GOOGLE_DIRECTIONS}
                target="_blank"
                rel="noreferrer"
                className="transport-option"
              >
                <strong>Google Maps</strong>
                <span>Rota pronta até a clínica</span>
                <Navigation size={18} />
              </a>

              <a
                href={WAZE}
                target="_blank"
                rel="noreferrer"
                className="transport-option"
              >
                <strong>Waze</strong>
                <span>Abrir navegação</span>
                <Navigation size={18} />
              </a>

              <button
                type="button"
                className="transport-option"
                onClick={() => openRideService(UBER)}
              >
                <strong>Uber</strong>
                <span>Abrir Uber + copiar destino</span>
                <CarFront size={18} />
              </button>

              <button
                type="button"
                className="transport-option"
                onClick={() => openRideService(NINETYNINE)}
              >
                <strong>99</strong>
                <span>Abrir 99 + copiar destino</span>
                <CarFront size={18} />
              </button>
            </div>

            <button
              type="button"
              className="transport-copy"
              onClick={copyAddress}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}

              {copied
                ? 'Endereço copiado'
                : 'Copiar endereço da clínica'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
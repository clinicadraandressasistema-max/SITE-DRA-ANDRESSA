import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { imagensDaPasta } from "../lib/media";

type Destination = {
  id: string;
  label: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  folder: string;
  description: string;
};

const destinations: Destination[] = [
  {
    id: "parana",
    label: "Paran\u00e1",
    country: "Brasil",
    region: "Sul do Brasil",
    lat: -25.4284,
    lng: -49.2733,
    folder: "experiencias/brasil",
    description:
      "No Paran\u00e1, a trajet\u00f3ria da Dra. Andressa se conecta \u00e0 sua base de atua\u00e7\u00e3o no Brasil, com planejamento individualizado, cuidado m\u00e9dico e experi\u00eancia em cirurgia, tricologia e restaura\u00e7\u00e3o capilar.",
  },
  {
    id: "santa-catarina",
    label: "Santa Catarina",
    country: "Brasil",
    region: "Sul do Brasil",
    lat: -27.5949,
    lng: -48.5482,
    folder: "experiencias/brasil",
    description:
      "Santa Catarina integra a atua\u00e7\u00e3o da Dra. Andressa no Sul do Brasil, reunindo experi\u00eancias profissionais e uma abordagem orientada por naturalidade, seguran\u00e7a e planejamento.",
  },
  {
    id: "madrid",
    label: "Madrid",
    country: "Espanha",
    region: "Europa",
    lat: 40.4168,
    lng: -3.7038,
    folder: "experiencias/madrid",
    description:
      "Madrid faz parte da trajet\u00f3ria internacional da Dra. Andressa, ampliando repert\u00f3rio profissional e conectando t\u00e9cnica, vis\u00e3o est\u00e9tica e experi\u00eancias em diferentes contextos.",
  },
  {
    id: "lisboa",
    label: "Lisboa",
    country: "Portugal",
    region: "Europa",
    lat: 38.7223,
    lng: -9.1393,
    folder: "experiencias/lisboa",
    description:
      "Lisboa representa mais um ponto dessa trajet\u00f3ria internacional, com experi\u00eancias profissionais ligadas ao cuidado individualizado, planejamento e naturalidade.",
  },
  {
    id: "israel",
    label: "Israel",
    country: "Israel",
    region: "Oriente M\u00e9dio",
    lat: 31.7683,
    lng: 35.2137,
    folder: "experiencias/israel",
    description:
      "Israel comp\u00f5e essa trajet\u00f3ria internacional com contato com diferentes contextos m\u00e9dicos, tecnologia e pr\u00e1tica profissional, ampliando perspectivas e repert\u00f3rio.",
  },
];

const routes = [
  { startLat: -25.4284, startLng: -49.2733, endLat: 40.4168, endLng: -3.7038 },
  { startLat: -25.4284, startLng: -49.2733, endLat: 38.7223, endLng: -9.1393 },
  { startLat: -25.4284, startLng: -49.2733, endLat: 31.7683, endLng: 35.2137 },
];

const pageCss = `
.world-exp{
  --wine:#71122a;--copper:#ca9266;--cream:#f7f2ee;
  min-height:100svh;background:#020307;color:#fff;
  font-family:"DM Sans",Arial,sans-serif;overflow:hidden;
}
.world-exp *{box-sizing:border-box}
.world-exp a{text-decoration:none;color:inherit}
.world-head{
  position:fixed;z-index:90;top:0;left:0;right:0;height:76px;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
  padding:0 clamp(18px,4vw,58px);
  background:linear-gradient(to bottom,rgba(0,0,0,.82),rgba(0,0,0,.18),transparent);
  pointer-events:none
}
.world-head>*{pointer-events:auto}
.world-back{justify-self:start;display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.72);font-size:12px;font-weight:700}
.world-brand{text-align:center}
.world-brand strong{display:block;font-family:"Playfair Display",Georgia,serif;font-size:22px;font-weight:500;letter-spacing:.04em}
.world-brand span{display:block;margin-top:4px;color:var(--copper);font-size:7px;font-weight:800;letter-spacing:.18em}
.world-head-tag{justify-self:end;color:rgba(255,255,255,.55);font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}

.globe-hero{position:relative;height:100svh;min-height:720px;overflow:hidden;background:#020307}
.globe-stage{position:absolute;inset:0;display:flex;justify-content:flex-end;align-items:center}
.globe-canvas{width:min(78vw,1180px);height:100%;margin-right:-2vw;position:relative}
.globe-canvas canvas{outline:none}
.globe-vignette{position:absolute;inset:0;pointer-events:none;background:
  linear-gradient(90deg,rgba(2,3,7,.98) 0%,rgba(2,3,7,.74) 23%,rgba(2,3,7,.16) 45%,transparent 67%),
  linear-gradient(0deg,rgba(2,3,7,.9),transparent 22%,transparent 78%,rgba(2,3,7,.55))}
.globe-copy{position:absolute;z-index:15;left:clamp(24px,6vw,96px);top:50%;transform:translateY(-50%);width:min(410px,36vw)}
.globe-kicker{display:flex;align-items:center;gap:10px;color:var(--copper);font-size:9px;letter-spacing:.23em;font-weight:800;text-transform:uppercase}
.globe-copy h1{margin:18px 0 20px;font-family:"Playfair Display",Georgia,serif;font-size:clamp(3.2rem,5vw,5.8rem);font-weight:500;line-height:.92;letter-spacing:-.035em}
.globe-copy h1 em{color:#e6b18a;font-weight:500}
.globe-copy p{max-width:380px;margin:0;color:rgba(255,255,255,.62);font-size:13px;line-height:1.75}
.globe-hint{display:flex;align-items:center;gap:9px;margin-top:28px;color:rgba(255,255,255,.72);font-size:10px;font-weight:700}
.globe-hint i{width:7px;height:7px;border-radius:50%;background:var(--copper);box-shadow:0 0 0 7px rgba(202,146,102,.12);animation:hintPulse 2s infinite}
@keyframes hintPulse{50%{box-shadow:0 0 0 13px rgba(202,146,102,0)}}

.location-strip{
  position:absolute;z-index:20;left:50%;bottom:26px;transform:translateX(-50%);
  display:flex;gap:6px;max-width:calc(100% - 40px);padding:6px;
  border:1px solid rgba(255,255,255,.11);border-radius:999px;
  background:rgba(9,10,13,.68);backdrop-filter:blur(16px);overflow:auto
}
.location-strip button{
  border:0;border-radius:999px;background:transparent;color:rgba(255,255,255,.62);
  padding:10px 14px;white-space:nowrap;font-size:9px;font-weight:800;letter-spacing:.04em;transition:.2s
}
.location-strip button:hover,.location-strip button.active{background:rgba(202,146,102,.16);color:#fff}
.location-strip button.active{box-shadow:inset 0 0 0 1px rgba(202,146,102,.32)}

.location-panel{
  position:fixed;z-index:100;right:24px;top:94px;bottom:24px;width:min(390px,calc(100vw - 32px));
  display:flex;flex-direction:column;overflow:hidden;
  border:1px solid rgba(255,255,255,.13);border-radius:26px;
  background:rgba(15,12,14,.82);box-shadow:0 34px 90px rgba(0,0,0,.48);
  backdrop-filter:blur(24px);animation:panelIn .35s ease
}
@keyframes panelIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.panel-close{
  position:absolute;z-index:5;right:14px;top:14px;width:38px;height:38px;display:grid;place-items:center;
  border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(0,0,0,.28);color:#fff
}
.panel-copy{padding:30px 30px 22px}
.panel-copy small{color:var(--copper);font-size:8px;letter-spacing:.18em;font-weight:800}
.panel-copy h2{margin:10px 0 3px;font-family:"Playfair Display",Georgia,serif;font-size:3.4rem;line-height:.94;font-weight:500}
.panel-copy strong{display:block;color:rgba(255,255,255,.72);font-size:10px}
.panel-copy p{margin:16px 0 0;color:rgba(255,255,255,.58);font-size:11px;line-height:1.68}

.panel-gallery{padding:0 14px 14px;min-height:0}
.panel-photo{position:relative;aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.05)}
.panel-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.035);transition:opacity .65s,transform 5.4s}
.panel-photo img.active{opacity:1;transform:scale(1)}
.panel-counter{position:absolute;right:11px;bottom:11px;padding:7px 9px;border-radius:999px;background:rgba(0,0,0,.62);font-size:8px;font-weight:800}
.panel-empty{aspect-ratio:4/3;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(145deg,rgba(113,18,42,.24),rgba(202,146,102,.08));color:#fff}
.panel-empty b{font-family:"Playfair Display",serif;font-size:22px;font-weight:500}
.panel-empty span{margin-top:7px;color:rgba(255,255,255,.5);font-size:10px}
.panel-controls{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.panel-controls>button{width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(255,255,255,.06);color:#fff}
.panel-dots{display:flex;gap:5px}.panel-dots button{width:6px;height:6px;padding:0;border:0;border-radius:10px;background:rgba(255,255,255,.24)}.panel-dots button.active{width:22px;background:var(--copper)}
.panel-footer{margin-top:auto;padding:18px 28px;border-top:1px solid rgba(255,255,255,.09);display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.5);font-size:9px}

@media(max-width:900px){
  .world-head{grid-template-columns:1fr auto}.world-head-tag{display:none}.world-brand{justify-self:end}.world-brand span{display:none}
  .globe-hero{min-height:700px}.globe-copy{top:130px;transform:none;left:20px;width:min(390px,calc(100% - 40px));pointer-events:none}
  .globe-copy h1{font-size:clamp(3rem,11vw,4.7rem)}.globe-copy p{max-width:320px}
  .globe-stage{align-items:flex-end;justify-content:center}.globe-canvas{width:120vw;height:75vh;margin:0 0 -4vh}
  .globe-vignette{background:linear-gradient(180deg,rgba(2,3,7,.88) 0%,rgba(2,3,7,.3) 35%,transparent 60%,rgba(2,3,7,.42) 100%)}
  .location-strip{bottom:14px}
  .location-panel{top:auto;right:10px;left:10px;bottom:10px;width:auto;max-height:62vh;border-radius:22px}
  .panel-copy{padding:24px 24px 18px}.panel-copy h2{font-size:2.7rem}.panel-photo,.panel-empty{aspect-ratio:16/9}
}
@media(max-width:520px){
  .globe-copy p{display:none}.globe-hint{margin-top:18px}.globe-copy{top:105px}
  .globe-canvas{width:145vw;height:72vh;margin-bottom:1vh}.location-strip{width:calc(100% - 24px)}
}
`;

export default function Experiencias() {
  const globeRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 900, height: 760 });
  const [selected, setSelected] = useState<Destination | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    document.title = "Experi\u00eancias | Dra. Andressa Dallarmi";
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const element = wrapRef.current;

    const update = () => {
      setSize({
        width: Math.max(320, element.clientWidth),
        height: Math.max(500, element.clientHeight),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const globe = globeRef.current;
      if (!globe) return;
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      globe.pointOfView({ lat: 15, lng: -20, altitude: 2.15 }, 0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  const photos = selected ? imagensDaPasta(selected.folder) : [];

  useEffect(() => {
    setPhotoIndex(0);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || photos.length < 2) return;
    const timer = window.setInterval(() => {
      setPhotoIndex((current) => (current + 1) % photos.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [selected?.id, photos.length]);

  const focusDestination = (destination: Destination) => {
    setSelected(destination);
    setPhotoIndex(0);

    const globe = globeRef.current;
    if (globe) {
      globe.controls().autoRotate = false;
      globe.pointOfView(
        { lat: destination.lat, lng: destination.lng, altitude: 1.55 },
        1100
      );
    }
  };

  const closePanel = () => {
    setSelected(null);
    const globe = globeRef.current;
    if (globe) {
      globe.controls().autoRotate = true;
      globe.pointOfView({ lat: 15, lng: -20, altitude: 2.15 }, 900);
    }
  };

  const ringData = useMemo(() => destinations, []);

  return (
    <div className="world-exp">
      <style>{pageCss}</style>

      <header className="world-head">
        <a className="world-back" href="/">
          <ArrowLeft size={16} />
          Voltar ao site
        </a>

        <a className="world-brand" href="/">
          <strong>DALL'ARMI</strong>
          <span>CL&Iacute;NICA M&Eacute;DICA &amp; CIR&Uacute;RGICA</span>
        </a>

        <span className="world-head-tag">Experi&ecirc;ncias pelo mundo</span>
      </header>

      <main className="globe-hero">
        <div className="globe-stage">
          <div className="globe-canvas" ref={wrapRef}>
            <Globe
              ref={globeRef}
              width={size.width}
              height={size.height}
              backgroundColor="#020307"
              backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
              globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
              showAtmosphere
              atmosphereColor="#8bc6ff"
              atmosphereAltitude={0.18}
              pointsData={destinations}
              pointLat="lat"
              pointLng="lng"
              pointAltitude={0.018}
              pointRadius={0.28}
              pointColor={(point: any) =>
                selected?.id === point.id ? "#ffffff" : "#ca9266"
              }
              onPointClick={(point: any) => focusDestination(point as Destination)}
              labelsData={destinations}
              labelLat="lat"
              labelLng="lng"
              labelText="label"
              labelAltitude={0.03}
              labelSize={0.58}
              labelDotRadius={0.18}
              labelColor={() => "rgba(255,255,255,.88)"}
              labelResolution={3}
              onLabelClick={(label: any) => focusDestination(label as Destination)}
              ringsData={ringData}
              ringLat="lat"
              ringLng="lng"
              ringColor={() => "rgba(202,146,102,.72)"}
              ringMaxRadius={2.4}
              ringPropagationSpeed={1.1}
              ringRepeatPeriod={1300}
              arcsData={routes}
              arcStartLat="startLat"
              arcStartLng="startLng"
              arcEndLat="endLat"
              arcEndLng="endLng"
              arcColor={() => ["rgba(202,146,102,.78)", "rgba(255,255,255,.22)"]}
              arcAltitudeAutoScale={0.35}
              arcStroke={0.45}
              arcDashLength={0.42}
              arcDashGap={0.75}
              arcDashAnimateTime={3200}
              onGlobeClick={() => selected && closePanel()}
            />
          </div>
        </div>

        <div className="globe-vignette" />

        <section className="globe-copy">
          <span className="globe-kicker">
            <MapPin size={14} />
            EXPERI&Ecirc;NCIAS INTERNACIONAIS
          </span>

          <h1>
            Uma trajet&oacute;ria
            <br />
            <em>pelo mundo.</em>
          </h1>

          <p>
            Explore o globo e conhe&ccedil;a os lugares que fazem parte da
            trajet&oacute;ria profissional da Dra. Andressa Dallarmi.
          </p>

          <div className="globe-hint">
            <i />
            Arraste o globo e clique nos pontos iluminados
          </div>
        </section>

        <div className="location-strip" aria-label="Destinos">
          {destinations.map((destination) => (
            <button
              key={destination.id}
              type="button"
              className={selected?.id === destination.id ? "active" : ""}
              onClick={() => focusDestination(destination)}
            >
              {destination.label}
            </button>
          ))}
        </div>
      </main>

      {selected && (
        <aside className="location-panel">
          <button
            type="button"
            className="panel-close"
            onClick={closePanel}
            aria-label="Fechar"
          >
            <X size={17} />
          </button>

          <div className="panel-copy">
            <small>{selected.region.toUpperCase()}</small>
            <h2>{selected.label}</h2>
            <strong>{selected.country}</strong>
            <p>{selected.description}</p>
          </div>

          <div className="panel-gallery">
            {photos.length ? (
              <>
                <div className="panel-photo">
                  {photos.map((src, index) => (
                    <img
                      key={src}
                      src={src}
                      alt={`${selected.label} - Dra. Andressa Dallarmi`}
                      className={index === photoIndex ? "active" : ""}
                    />
                  ))}
                  <span className="panel-counter">
                    {String(photoIndex + 1).padStart(2, "0")} /{" "}
                    {String(photos.length).padStart(2, "0")}
                  </span>
                </div>

                {photos.length > 1 && (
                  <div className="panel-controls">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex(
                          (photoIndex - 1 + photos.length) % photos.length
                        )
                      }
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="panel-dots">
                      {photos.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          className={index === photoIndex ? "active" : ""}
                          onClick={() => setPhotoIndex(index)}
                          aria-label={`Ver foto ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex((photoIndex + 1) % photos.length)
                      }
                      aria-label="Pr\u00f3xima foto"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="panel-empty">
                <b>Galeria em atualiza&ccedil;&atilde;o</b>
                <span>As fotos deste destino ser&atilde;o adicionadas aqui.</span>
              </div>
            )}
          </div>

          <div className="panel-footer">
            <MapPin size={14} />
            Dra. Andressa Dallarmi &middot; Experi&ecirc;ncias
          </div>
        </aside>
      )}
    </div>
  );
}

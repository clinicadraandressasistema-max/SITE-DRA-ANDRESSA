$ErrorActionPreference = "Stop"
Set-Location "C:\Projetos\SITE-DRA-ANDRESSA"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = ".backup-experiencias-$stamp"
New-Item -ItemType Directory -Force $backup | Out-Null
Copy-Item ".\src\App.tsx" "$backup\App.tsx" -Force
Copy-Item ".\src\main.tsx" "$backup\main.tsx" -Force

$folders = @("brasil","madrid","lisboa","israel")
foreach ($f in $folders) {
  $dir = ".\src\assets\images\experiencias\$f"
  New-Item -ItemType Directory -Force $dir | Out-Null
  if (-not (Test-Path "$dir\LEIA-ME.txt")) {
    "Coloque aqui as fotos desta experiencia. Ex.: 01.jpg, 02.jpg, 03.webp. O carrossel identifica automaticamente." |
      Set-Content "$dir\LEIA-ME.txt" -Encoding UTF8
  }
}

$page = @'
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Plane, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { imagensDaPasta } from "../lib/media";

type Local = {
  id: string;
  pais: string;
  lugar: string;
  texto: string;
  pasta: string;
  left: string;
  top: string;
};

const locais: Local[] = [
  {
    id: "brasil",
    pais: "Brasil",
    lugar: "Paraná e Santa Catarina",
    texto:
      "Paraná e Santa Catarina fazem parte da base da atuação da Dra. Andressa no Brasil, reunindo cuidado médico, planejamento individualizado e experiência em cirurgia, tricologia e restauração capilar.",
    pasta: "experiencias/brasil",
    left: "34%",
    top: "72%",
  },
  {
    id: "madrid",
    pais: "Espanha",
    lugar: "Madrid",
    texto:
      "Madrid integra a trajetória internacional da Dra. Andressa, conectando precisão técnica, visão estética e experiência profissional em diferentes contextos médicos.",
    pasta: "experiencias/madrid",
    left: "49%",
    top: "37%",
  },
  {
    id: "lisboa",
    pais: "Portugal",
    lugar: "Lisboa",
    texto:
      "Em Lisboa, a atuação internacional se soma à trajetória da Dra. Andressa com atendimento e procedimentos orientados por planejamento, naturalidade e cuidado individualizado.",
    pasta: "experiencias/lisboa",
    left: "46.5%",
    top: "40%",
  },
  {
    id: "israel",
    pais: "Israel",
    lugar: "Israel",
    texto:
      "Israel compõe essa trajetória profissional com uma experiência marcada pelo contato com diferentes contextos médicos, tecnologia e prática internacional.",
    pasta: "experiencias/israel",
    left: "57%",
    top: "46%",
  },
];

const css = `
.exp{min-height:100vh;background:#130d0f;color:#fff;font-family:"DM Sans",Arial,sans-serif}
.exp *{box-sizing:border-box}.exp a{text-decoration:none;color:inherit}
.exp-head{position:fixed;z-index:50;top:0;left:0;right:0;height:76px;padding:0 clamp(18px,4vw,60px);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;background:rgba(19,13,15,.8);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)}
.exp-back{display:flex;align-items:center;gap:8px;font-size:12px;color:#d7cdd0}.exp-brand{text-align:center}.exp-brand strong{display:block;font-family:"Playfair Display",serif;font-size:23px;font-weight:500}.exp-brand span,.exp-label{font-size:7px;letter-spacing:.18em;color:#ca9266;font-weight:800}.exp-label{justify-self:end}
.exp-hero{min-height:100vh;padding:145px clamp(24px,8vw,145px) 90px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;background:radial-gradient(circle at 78% 20%,rgba(202,146,102,.17),transparent 28%),linear-gradient(135deg,#130d0f,#281116 55%,#4a0d1d)}
.exp-hero:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:80px 80px;opacity:.45}
.exp-copy{position:relative;z-index:2;max-width:1050px}.exp-kicker{display:flex;gap:9px;align-items:center;color:#ca9266;font-size:9px;font-weight:800;letter-spacing:.22em}.exp h1{font-family:"Playfair Display",serif;font-size:clamp(4rem,8vw,8.2rem);line-height:.88;font-weight:500;letter-spacing:-.045em;margin:25px 0}.exp h1 em{color:#e6b18a;font-weight:500}.exp-copy p{max-width:620px;color:rgba(255,255,255,.65);line-height:1.8;font-size:14px}.exp-jump{display:inline-flex;gap:18px;margin-top:28px;padding-bottom:8px;border-bottom:1px solid rgba(202,146,102,.55);font-size:12px}
.exp-map-sec{padding:100px clamp(16px,5vw,76px) 110px;background:#f7f2ee;color:#2b2422}.exp-intro{max-width:1450px;margin:0 auto 45px;display:flex;justify-content:space-between;align-items:end;gap:40px}.exp-intro small{color:#71122a;font-weight:800;letter-spacing:.2em}.exp-intro h2{margin:10px 0 0;font-family:"Playfair Display",serif;font-size:clamp(3rem,5vw,5.5rem);font-weight:500}.exp-intro p{max-width:450px;color:#756c68;line-height:1.7;font-size:13px}
.exp-grid{max-width:1450px;margin:auto;display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.map-card,.detail{border-radius:28px;overflow:hidden}
.map-card{background:radial-gradient(circle at 50% 45%,rgba(202,146,102,.09),transparent 33%),#151012;min-height:650px;display:flex;flex-direction:column;color:#fff;box-shadow:0 26px 70px rgba(50,18,27,.14)}
.map-top,.map-bottom{padding:22px 26px;display:flex;justify-content:space-between;color:rgba(255,255,255,.45);font-size:8px;letter-spacing:.17em;font-weight:800}.map-top{border-bottom:1px solid rgba(255,255,255,.07)}.map-bottom{border-top:1px solid rgba(255,255,255,.07)}.map-bottom span{display:flex;align-items:center;gap:7px}
.world{position:relative;flex:1;min-height:530px;overflow:hidden}.world svg{position:absolute;inset:8% 4%;width:92%;height:84%}.land path{fill:rgba(255,255,255,.075);stroke:rgba(255,255,255,.18);stroke-width:1.2}.grid path{fill:none;stroke:rgba(255,255,255,.035)}
.pin{position:absolute;z-index:5;transform:translate(-50%,-50%);width:22px;height:22px;border:0;background:transparent}.pin:before{content:"";position:absolute;inset:6px;border-radius:50%;background:#ca9266;border:2px solid #fff;box-shadow:0 0 0 7px rgba(202,146,102,.12)}.pin:after{content:"";position:absolute;inset:0;border:1px solid #ca9266;border-radius:50%;animation:pulse 2s infinite}.pin b{position:absolute;top:28px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(16,11,13,.9);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 9px;color:#ddd;font-size:8px}.pin.active b,.pin:hover b{background:#71122a;color:#fff;border-color:#ca9266}.pin.active:before{background:#71122a}
@keyframes pulse{0%{transform:scale(.7);opacity:1}100%{transform:scale(2.2);opacity:0}}
.detail{background:#fff;border:1px solid rgba(113,18,42,.09);display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(50,18,27,.08)}.detail-copy{padding:32px}.detail-copy small{color:#ca9266;font-size:8px;font-weight:800;letter-spacing:.18em}.detail-copy h3{margin:8px 0 0;color:#71122a;font-family:"Playfair Display",serif;font-size:clamp(2.7rem,4vw,4rem);font-weight:500;line-height:.95}.detail-copy strong{display:block;margin-top:7px;font-size:11px}.detail-copy p{color:#776e6a;font-size:12px;line-height:1.7;margin-top:16px}
.gallery{padding:0 16px 16px}.photo-stage{position:relative;aspect-ratio:4/3;border-radius:20px;overflow:hidden;background:#f2ebe7}.photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.04);transition:opacity .7s,transform 5.5s}.photo.active{opacity:1;transform:scale(1)}.count{position:absolute;right:12px;bottom:12px;background:rgba(15,10,12,.7);color:#fff;border-radius:999px;padding:7px 9px;font-size:8px}
.controls{display:flex;align-items:center;justify-content:space-between;margin-top:10px}.controls>button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(113,18,42,.15);background:#fff;color:#71122a}.dots{display:flex;gap:5px}.dots button{width:6px;height:6px;border:0;border-radius:10px;background:#d7ccc7;padding:0}.dots button.active{width:22px;background:#71122a}
.empty{min-height:240px;border-radius:20px;background:#f8f2ef;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#71122a;padding:30px}.empty strong{font-family:"Playfair Display",serif;font-size:24px;font-weight:500;margin-top:10px}.empty p{font-size:11px;color:#7a716d;max-width:270px}
.tabs{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(113,18,42,.08)}.tabs button{min-height:76px;padding:13px 16px;text-align:left;border:0;border-right:1px solid rgba(113,18,42,.08);border-bottom:1px solid rgba(113,18,42,.08);background:#fff}.tabs button:nth-child(even){border-right:0}.tabs span{display:block;font-size:7px;color:#a49a95;text-transform:uppercase;letter-spacing:.14em;font-weight:800}.tabs strong{display:block;margin-top:4px;font-family:"Playfair Display",serif;font-size:15px}.tabs button.active{background:#71122a;color:#fff}.tabs button.active span{color:#d9ad8b}
.exp-final{padding:120px 20px;text-align:center;background:#130d0f}.exp-final small{color:#ca9266;letter-spacing:.2em;font-weight:800}.exp-final h2{font-family:"Playfair Display",serif;font-size:clamp(3rem,5vw,5.4rem);font-weight:500;line-height:.98;margin:18px auto}.exp-final h2 em{color:#e6b18a;font-weight:500}.exp-final p{max-width:560px;margin:auto;color:rgba(255,255,255,.6);font-size:13px;line-height:1.7}.exp-final a{display:inline-flex;gap:15px;margin-top:28px;padding:13px 18px;border:1px solid rgba(202,146,102,.35);border-radius:999px;font-size:11px}
@media(max-width:1000px){.exp-grid{grid-template-columns:1fr}.map-card{min-height:560px}}
@media(max-width:700px){.exp-head{height:66px;padding:0 14px;grid-template-columns:1fr auto}.exp-label,.exp-brand span{display:none}.exp-brand strong{font-size:18px}.exp-hero{min-height:90vh;padding:115px 20px 80px}.exp h1{font-size:clamp(3.5rem,18vw,5.2rem)}.exp-map-sec{padding:75px 12px 80px}.exp-intro{display:block}.exp-intro p{margin-top:18px}.map-card{min-height:430px;border-radius:20px}.world{min-height:340px}.world svg{inset:5% -8%;width:116%;height:90%}.map-bottom span:last-child{display:none}.detail{border-radius:20px}.detail-copy{padding:26px 22px}.exp-final{padding:85px 18px}}
`;

export default function Experiencias() {
  const [id, setId] = useState("brasil");
  const [foto, setFoto] = useState(0);
  const local = locais.find((item) => item.id === id) || locais[0];
  const fotos = imagensDaPasta(local.pasta);

  useEffect(() => {
    document.title = "Experiências | Dra. Andressa Dallarmi";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => setFoto(0), [id]);

  useEffect(() => {
    if (fotos.length < 2) return;
    const timer = window.setInterval(
      () => setFoto((atual) => (atual + 1) % fotos.length),
      5500
    );
    return () => window.clearInterval(timer);
  }, [fotos.length, id]);

  const anterior = () =>
    fotos.length &&
    setFoto((atual) => (atual - 1 + fotos.length) % fotos.length);
  const proxima = () =>
    fotos.length && setFoto((atual) => (atual + 1) % fotos.length);

  return (
    <div className="exp">
      <style>{css}</style>

      <header className="exp-head">
        <a className="exp-back" href="/">
          <ArrowLeft size={17} /> Voltar ao site
        </a>
        <a className="exp-brand" href="/">
          <strong>DALL'ARMI</strong>
          <span>CLÍNICA MÉDICA & CIRÚRGICA</span>
        </a>
        <span className="exp-label">Experiências</span>
      </header>

      <section className="exp-hero">
        <div className="exp-copy">
          <span className="exp-kicker">
            <Plane size={15} /> EXPERIÊNCIAS & TRAJETÓRIA
          </span>
          <h1>
            Uma trajetória que
            <br />
            <em>atravessa fronteiras.</em>
          </h1>
          <p>
            Explore alguns dos lugares que fazem parte da atuação e das
            experiências profissionais da Dra. Andressa Dallarmi.
          </p>
          <a className="exp-jump" href="#mapa">
            Explorar o mapa <span>↓</span>
          </a>
        </div>
      </section>

      <section className="exp-map-sec" id="mapa">
        <div className="exp-intro">
          <div>
            <small>MAPA DE EXPERIÊNCIAS</small>
            <h2>Escolha um destino.</h2>
          </div>
          <p>
            Clique nos pontos destacados para conhecer cada local e navegar
            pelos registros da trajetória da Dra. Andressa.
          </p>
        </div>

        <div className="exp-grid">
          <div className="map-card">
            <div className="map-top">
              <span>TRAJETÓRIA INTERNACIONAL</span>
              <span>4 DESTINOS</span>
            </div>

            <div className="world">
              <svg viewBox="0 0 1000 500" aria-label="Mapa-múndi">
                <g className="grid">
                  <path d="M0 125H1000M0 250H1000M0 375H1000M250 0V500M500 0V500M750 0V500" />
                </g>
                <g className="land">
                  <path d="M86 92c39-42 88-56 137-44 37 9 61 29 92 36 26 7 53 2 72 21 18 18 5 39-18 46-30 9-58 5-76 27-15 18-18 50-43 58-32 10-45-26-70-38-29-14-73-12-92-42-12-20-16-45-2-64Z" />
                  <path d="M287 231c31-11 64 6 82 31 15 21 17 48 9 73-8 26-24 48-31 75-7 28-7 62-29 83-15-13-19-35-27-53-10-23-25-43-30-68-7-33 1-68 9-100 4-16 4-31 17-41Z" />
                  <path d="M432 91c20-18 47-21 69-12 13 6 25 16 40 15 25-2 46-17 72-14 25 3 43 21 65 30 29 12 62 9 92 21 28 11 55 33 60 64 4 23-8 47-29 56-20 9-43 5-64 5-31 0-63 11-94 7-23-3-43-17-67-16-20 1-38 14-58 12-24-2-36-24-48-43-13-22-35-36-46-60-9-20-9-48 8-65Z" />
                  <path d="M493 220c31-6 67 7 84 34 15 24 12 53 4 80-9 31-20 63-39 89-14 20-37 39-62 31-22-7-30-34-34-56-5-28-5-58 1-86 7-33 13-80 46-92Z" />
                  <path d="M801 317c20-18 49-22 73-12 24 10 43 35 35 60-8 24-36 33-60 35-23 2-51-4-62-25-10-19-2-43 14-58Z" />
                </g>
              </svg>

              {locais.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={"pin " + (item.id === id ? "active" : "")}
                  style={{ left: item.left, top: item.top }}
                  onClick={() => setId(item.id)}
                >
                  <b>{item.lugar}</b>
                </button>
              ))}
            </div>

            <div className="map-bottom">
              <span><MapPin size={14} /> Clique em um ponto</span>
              <span>Dra. Andressa Dallarmi</span>
            </div>
          </div>

          <aside className="detail">
            <div className="detail-copy">
              <small>EXPERIÊNCIA PROFISSIONAL</small>
              <h3>{local.lugar}</h3>
              <strong>{local.pais}</strong>
              <p>{local.texto}</p>
            </div>

            <div className="gallery">
              {fotos.length ? (
                <>
                  <div className="photo-stage">
                    {fotos.map((src, index) => (
                      <img
                        key={src}
                        src={src}
                        alt={"Dra. Andressa em " + local.lugar}
                        className={"photo " + (index === foto ? "active" : "")}
                      />
                    ))}
                    <span className="count">
                      {String(foto + 1).padStart(2, "0")} / {String(fotos.length).padStart(2, "0")}
                    </span>
                  </div>

                  {fotos.length > 1 && (
                    <div className="controls">
                      <button onClick={anterior} aria-label="Foto anterior">
                        <ChevronLeft size={18} />
                      </button>
                      <div className="dots">
                        {fotos.map((_, index) => (
                          <button
                            key={index}
                            className={index === foto ? "active" : ""}
                            onClick={() => setFoto(index)}
                            aria-label={"Foto " + (index + 1)}
                          />
                        ))}
                      </div>
                      <button onClick={proxima} aria-label="Próxima foto">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty">
                  <Sparkles size={24} />
                  <strong>Galeria em atualização</strong>
                  <p>Novos registros de {local.lugar} serão adicionados em breve.</p>
                </div>
              )}
            </div>

            <div className="tabs">
              {locais.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === id ? "active" : ""}
                  onClick={() => setId(item.id)}
                >
                  <span>{item.pais}</span>
                  <strong>{item.lugar}</strong>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="exp-final">
        <small>UMA TRAJETÓRIA EM MOVIMENTO</small>
        <h2>
          Técnica, repertório e cuidado
          <br />
          <em>construídos em diferentes lugares.</em>
        </h2>
        <p>
          Cada experiência acrescenta uma nova perspectiva ao planejamento e
          ao cuidado individualizado.
        </p>
        <a href="/">Voltar para a Clínica Dall'Armi <span>→</span></a>
      </section>
    </div>
  );
}
'@

$page | Set-Content ".\src\pages\Experiencias.tsx" -Encoding UTF8

$main = @'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import Booking from "./pages/Booking";
import Experiencias from "./pages/Experiencias";
import './styles/global.css'
import './styles/site-refinement.css'
import './styles/booking-upgrade.css'
import './styles/brand-refresh.css'
import "./App.css";

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {pathname === "/agendar" || pathname === "/autoagendamento" ? (
        <>
          <a
            href="/"
            aria-label="Voltar para o site da Clínica Dall'Armi"
            style={{
              position: "fixed", top: "18px", left: "18px", zIndex: 99999,
              display: "inline-flex", alignItems: "center", gap: "8px",
              minHeight: "42px", padding: "0 16px", borderRadius: "999px",
              background: "rgba(255,255,255,0.94)", color: "#71151d",
              textDecoration: "none", fontFamily: "Arial, sans-serif",
              fontSize: "13px", fontWeight: 700,
              boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(113,21,29,0.12)"
            }}
          >
            ← Voltar para o site
          </a>
          <Booking />
        </>
      ) : pathname === "/experiencias" ? (
        <Experiencias />
      ) : (
        <App />
      )}
    </BrowserRouter>
  </StrictMode>,
)
'@

$main | Set-Content ".\src\main.tsx" -Encoding UTF8

$app = Get-Content ".\src\App.tsx" -Raw

if ($app -notmatch 'href="/experiencias" onClick=\{\(\) => setMenuOpen\(false\)\}') {
  $app = $app.Replace(
    '<a href="#equipe" onClick={() => setMenuOpen(false)}>Corpo Clínico</a>',
    '<a href="#equipe" onClick={() => setMenuOpen(false)}>Corpo Clínico</a>' + "`r`n" +
    '            <a href="/experiencias" onClick={() => setMenuOpen(false)}>Experiências</a>'
  )
}

$app = [regex]::Replace(
  $app,
  '<a className="btn btn-light" href="[^"]*">\s*Conheça a Dra\. Andressa\s*</a>',
  '<a className="btn btn-light" href="/experiencias">' + "`r`n" +
  '                  Conheça a Dra. Andressa' + "`r`n" +
  '                </a>'
)

if ($app -notmatch '<a href="/experiencias">Experiências</a>') {
  $app = $app.Replace(
    '<a href="#equipe">Corpo Clínico</a>',
    '<a href="#equipe">Corpo Clínico</a>' + "`r`n" +
    '            <a href="/experiencias">Experiências</a>'
  )
}

$app | Set-Content ".\src\App.tsx" -Encoding UTF8

Write-Host "`n=== TESTANDO BUILD ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
  Copy-Item "$backup\App.tsx" ".\src\App.tsx" -Force
  Copy-Item "$backup\main.tsx" ".\src\main.tsx" -Force
  Write-Host "`nBUILD COM ERRO. APP.TSX E MAIN.TSX FORAM RESTAURADOS. NADA FOI PUBLICADO." -ForegroundColor Red
  exit 1
}

git add src/App.tsx src/main.tsx src/pages/Experiencias.tsx src/assets/images/experiencias
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "Adiciona experiencia imersiva com mapa internacional"
}

git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nPUBLICADO COM SUCESSO!" -ForegroundColor Green
  Write-Host "Abra: https://drandressadallarmi.com.br/experiencias" -ForegroundColor Yellow
  Write-Host "`nPastas para fotos:"
  Write-Host "src/assets/images/experiencias/brasil"
  Write-Host "src/assets/images/experiencias/madrid"
  Write-Host "src/assets/images/experiencias/lisboa"
  Write-Host "src/assets/images/experiencias/israel"
} else {
  Write-Host "`nO BUILD DEU CERTO, MAS O PUSH NAO FOI CONCLUIDO." -ForegroundColor Red
}

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

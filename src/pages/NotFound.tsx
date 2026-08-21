import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function NotFound() { return <section className="not-found"><img src="/brand/logo.png" alt=""/><span>404</span><h1>Esta página não está por aqui.</h1><Link className="button button-primary" to="/"><ArrowLeft size={17}/> Voltar ao início</Link></section> }

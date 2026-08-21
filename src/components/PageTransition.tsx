import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <main key={location.pathname} className="page-transition">
      {children}
    </main>
  )
}

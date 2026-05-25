'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface PropriedadesRevelar {
  children: ReactNode
  classeEfeito?: string
  duracaoMs?: number
  atrasoMs?: number
}

export default function RevelarScroll({
  children,
  classeEfeito = 'translate-y-8 opacity-0',
  duracaoMs = 800,
  atrasoMs = 0
}: PropriedadesRevelar) {
  const [visivel, setVisivel] = useState(false)
  const elementoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (elementoRef.current) {
      observer.observe(elementoRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const classesEstilo = visivel 
    ? 'translate-y-0 opacity-100' 
    : classeEfeito

  return (
    <div
      ref={elementoRef}
      className={`transition-all cubic-bezier(0.4, 0, 0.2, 1) ${classesEstilo}`}
      style={{
        transitionDuration: `${duracaoMs}ms`,
        transitionDelay: `${atrasoMs}ms`
      }}
    >
      {children}
    </div>
  )
}

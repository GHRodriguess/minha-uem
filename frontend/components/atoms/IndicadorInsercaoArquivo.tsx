'use client'

import React from 'react'

interface IndicadorInsercaoArquivoProps {
  posicao: 'antes' | 'depois'
  visivel: boolean
}

export function IndicadorInsercaoArquivo({ posicao, visivel }: IndicadorInsercaoArquivoProps) {
  if (!visivel) return null

  const positionClass = posicao === 'antes' ? '-top-1.5' : '-bottom-1.5'

  return (
    <div
      className={`absolute ${positionClass} left-2 right-2 h-1 bg-primary rounded-full z-30 pointer-events-none shadow-[0_0_10px_var(--primary)] flex items-center transition-all animate-in fade-in zoom-in-95 duration-150`}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-1 border-2 border-background shadow-sm" />
      <div className="w-2.5 h-2.5 rounded-full bg-primary -mr-1 ml-auto border-2 border-background shadow-sm" />
    </div>
  )
}

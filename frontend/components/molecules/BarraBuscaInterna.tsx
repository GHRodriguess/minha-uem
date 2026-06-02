'use client'

import React from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface BarraBuscaInternaProps {
  isOpen: boolean
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onNext: () => void
  onPrev: () => void
  currentMatch: number
  totalMatches: number
  onClose: () => void
}

export function BarraBuscaInterna({
  isOpen,
  searchTerm,
  onSearchTermChange,
  onNext,
  onPrev,
  currentMatch,
  totalMatches,
  onClose
}: BarraBuscaInternaProps) {
  if (!isOpen) return null

  const lidarComKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onNext()
    }
  }

  return (
    <div className="flex items-center bg-transparent justify-between gap-3 px-4 py-2  backdrop-blur-[1px] border-border animate-in slide-in-from-top duration-150 shrink-0 select-none">
      <div className="flex items-center gap-2.5 flex-1 max-w-sm">
        <div className="w-full h-8 flex items-center border border-border/90 bg-background/50 backdrop-blur-xl rounded-xl focus-within:bg-background/70 transition-all duration-200 overflow-hidden">
          <input
            type="text"
            placeholder="Pesquisar no documento..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyDown={lidarComKeyDown}
            className="w-full h-full px-3 bg-transparent border-none text-xs font-semibold text-foreground focus:outline-none"
            autoFocus
          />
        </div>
        
        {totalMatches > 0 && (
          <span className="text-[10px] font-black text-foreground bg-background/70 backdrop-blur-xl border border-border/80 px-2.5 py-0.5 rounded-full shrink-0 select-none shadow-sm">
            {currentMatch} de {totalMatches}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={totalMatches === 0}
          className="p-1.5 border border-border/40 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Ocorrência anterior"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={totalMatches === 0}
          className="p-1.5 border border-border/40 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Próxima ocorrência"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-border/40 mx-1" />
        
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 border border-border/40 bg-background/60 backdrop-blur-md hover:bg-background/80 text-foreground rounded-lg transition-all duration-200 cursor-pointer"
          title="Fechar busca"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

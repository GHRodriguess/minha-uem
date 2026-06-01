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
    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-card/90 backdrop-blur-md animate-in slide-in-from-top duration-150 shrink-0 select-none">
      <div className="flex items-center gap-2.5 flex-1 max-w-sm">
        <input
          type="text"
          placeholder="Pesquisar no documento..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onKeyDown={lidarComKeyDown}
          className="w-full h-8 px-3 border border-border bg-background rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          autoFocus
        />
        
        {totalMatches > 0 && (
          <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full shrink-0 select-none shadow-sm">
            {currentMatch} de {totalMatches}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={totalMatches === 0}
          className="p-1.5 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Ocorrência anterior"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={totalMatches === 0}
          className="p-1.5 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Próxima ocorrência"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-border/40 mx-1" />
        
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          title="Fechar busca"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

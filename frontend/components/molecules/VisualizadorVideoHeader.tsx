'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Brain } from 'lucide-react'

interface VisualizadorVideoHeaderProps {
  materiaId: number
  titulo: string
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  chatIAOpen: boolean
  setChatIAOpen: React.Dispatch<React.SetStateAction<boolean>>
  fecharPdf: () => void
}

export function VisualizadorVideoHeader({
  materiaId,
  titulo,
  sidebarOpen,
  setSidebarOpen,
  chatIAOpen,
  setChatIAOpen,
  fecharPdf
}: VisualizadorVideoHeaderProps) {
  return (
    <header className="h-14 px-6 border-b border-border bg-card/70 backdrop-blur-md flex items-center justify-between shrink-0">
      <Link href={`/disciplinas/${materiaId}/videos`} className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Galeria</span>
      </Link>
      <h1 className="text-sm font-black text-foreground uppercase tracking-wider hidden md:block max-w-md truncate">
        {titulo}
      </h1>
      <div className="flex items-center gap-2">
        <button onClick={() => setSidebarOpen(prev => !prev)} className={`flex items-center justify-center gap-1.5 h-9 px-3 border rounded-xl text-xs font-bold transition-all shadow-sm ${sidebarOpen ? 'bg-primary/10 border-primary/25 text-primary' : 'bg-background border-border hover:bg-muted text-muted-foreground'}`}>
          <span>Conteúdo</span>
        </button>
        <button onClick={() => { setChatIAOpen(prev => !prev); fecharPdf() }} className={`flex items-center justify-center gap-1.5 h-9 px-3 border rounded-xl text-xs font-bold transition-all shadow-sm ${chatIAOpen ? 'bg-primary/10 border-primary/25 text-primary font-black' : 'bg-background border-border hover:bg-muted text-muted-foreground'}`}>
          <Brain className="w-3.5 h-3.5" />
          <span>Assistente IA</span>
        </button>
      </div>
    </header>
  )
}

'use client'

import React from 'react'
import { CheckCircle2, Cloud, HardDrive } from 'lucide-react'

interface PainelEstatisticasLegendaProps {
  totalFiles: number
  totalDownloaded: number
  totalPending: number
  isFileSystemSupported: boolean
}

export function PainelEstatisticasLegenda({
  totalFiles,
  totalDownloaded,
  totalPending,
  isFileSystemSupported
}: PainelEstatisticasLegendaProps) {
  return (
    <div className="bg-card/25 backdrop-blur-md border border-border/25 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground font-bold">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span>Total de Arquivos: <span className="text-foreground">{totalFiles}</span></span>
        </div>

        {isFileSystemSupported && (
          <>
            <span className="hidden md:inline text-border">|</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Baixados localmente: <span className="text-foreground">{totalDownloaded}</span></span>
            </div>
            <span className="hidden md:inline text-border">|</span>
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span>Disponíveis no Drive: <span className="text-foreground">{totalPending}</span></span>
            </div>
          </>
        )}
      </div>

      {isFileSystemSupported && (
        <div className="flex flex-wrap items-center justify-center gap-3 border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto border-border/40">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Legenda dos Status:</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="font-medium text-muted-foreground/80">Salvo no computador</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Cloud className="w-3 h-3 text-muted-foreground/60" />
            <span className="font-medium text-muted-foreground/80">Disponível no Drive</span>
          </div>
        </div>
      )}
    </div>
  )
}

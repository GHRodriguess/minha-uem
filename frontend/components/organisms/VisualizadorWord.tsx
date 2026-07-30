'use client'

import React from 'react'
import { FileEdit, ExternalLink, Laptop } from 'lucide-react'
import { obterNomeExibicao, obterNomeComExtensao } from '@/lib/utils/formatadorNomeArquivo'

interface VisualizadorWordProps {
  driveFileId: string | null
  originalName: string
  localUrl: string | null
  onOpenLocal?: () => void
}

export function VisualizadorWord({
  driveFileId,
  originalName,
  localUrl,
  onOpenLocal
}: VisualizadorWordProps) {
  const isLocalOnly = !driveFileId || driveFileId.startsWith('local_')

  if (!isLocalOnly && driveFileId) {
    return (
      <div className="w-full h-full bg-background relative">
        <iframe
          src={`https://drive.google.com/file/d/${driveFileId}/preview`}
          className="absolute inset-0 w-full h-full border-0 bg-background"
          allow="autoplay"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-card border border-border/40 rounded-2xl shadow-inner max-w-md mx-auto my-auto gap-4">
      <div className="p-4 bg-primary/10 text-primary rounded-2xl">
        <FileEdit className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-black text-foreground uppercase tracking-wide truncate max-w-xs">
          {obterNomeExibicao(null, originalName)}
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Documentos do Word locais não podem ser pré-visualizados diretamente no navegador. Você pode abrir o arquivo utilizando o editor do seu dispositivo.
        </p>
      </div>

      <div className="flex flex-col w-full gap-2 mt-2">
        {onOpenLocal && localUrl && (
          <button
            onClick={onOpenLocal}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Laptop className="w-4 h-4" />
            <span>Abrir no Dispositivo</span>
          </button>
        )}

        {localUrl && (
          <a
            href={localUrl}
            download={obterNomeComExtensao(originalName, originalName)}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Fazer Download</span>
          </a>
        )}
      </div>
    </div>
  )
}

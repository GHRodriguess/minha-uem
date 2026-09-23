'use client'

import React from 'react'
import { GripVertical } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { IconeArquivo } from '@/components/atoms/IconeArquivo'
import { IndicadorInsercaoArquivo } from '@/components/atoms/IndicadorInsercaoArquivo'
import { AcoesCardArquivo } from '@/components/molecules/AcoesCardArquivo'
import { CampoNomeArquivo } from '@/components/molecules/CampoNomeArquivo'
import { useCardArrasteArquivo } from '@/lib/hooks/useCardArrasteArquivo'

interface CardArquivoCompactoProps {
  arquivo: ArquivoClassroom
  categoriaNome: string
  isFileSystemSupported: boolean
  isReallyDownloaded: boolean
  progressoDownload: number | undefined
  activeDraggedId: string | null
  onPreVisualizar: (arq: ArquivoClassroom) => void
  onAlternarOcultar: (arq: ArquivoClassroom) => void
  onExcluirLocal: (arq: ArquivoClassroom) => void
  onBaixarLocal: (arq: ArquivoClassroom) => void
  onSalvarNome: (arq: ArquivoClassroom, novoNome: string) => Promise<void>
  onMoverArquivo: (draggedId: string, targetId: string | null, posicao: 'antes' | 'depois' | 'fim', categoriaDestino: string) => void
  onDefinirArquivoArrastando: (draggedId: string | null) => void
}

export function CardArquivoCompacto({
  arquivo,
  categoriaNome,
  isFileSystemSupported,
  isReallyDownloaded,
  progressoDownload,
  activeDraggedId,
  onPreVisualizar,
  onAlternarOcultar,
  onExcluirLocal,
  onBaixarLocal,
  onSalvarNome,
  onMoverArquivo,
  onDefinirArquivoArrastando
}: CardArquivoCompactoProps) {
  const {
    isBeingDragged,
    dropPosition,
    lidarComDragStart,
    lidarComDragEnd,
    lidarComDragOver,
    lidarComDragLeave,
    lidarComDrop
  } = useCardArrasteArquivo({ arquivo, categoriaNome, activeDraggedId, onMoverArquivo, onDefinirArquivoArrastando })

  const ext = arquivo.original_name.split('.').pop()?.toLowerCase() || ''
  const supportsPreview = !arquivo.drive_file_id.startsWith('local_') || ext === 'pdf' || ['mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp'].includes(ext)

  return (
    <div
      draggable
      onDragStart={lidarComDragStart}
      onDragEnd={lidarComDragEnd}
      onDragOver={lidarComDragOver}
      onDragLeave={lidarComDragLeave}
      onDrop={lidarComDrop}
      className={`relative w-full py-3.5 px-4 flex items-center justify-between gap-4 transition-all text-xs text-foreground font-medium rounded-xl border cursor-grab active:cursor-grabbing backdrop-blur-xs ${
        isBeingDragged ? 'opacity-30 border-dashed border-primary/50' : 'border-border/20 bg-card/15 hover:bg-card/30'
      } ${arquivo.is_ignored ? 'opacity-50 bg-muted/5' : ''}`}
    >
      <IndicadorInsercaoArquivo posicao="antes" visivel={dropPosition === 'antes' && !isBeingDragged} />
      <IndicadorInsercaoArquivo posicao="depois" visivel={dropPosition === 'depois' && !isBeingDragged} />

      <div className="flex items-center gap-3 min-w-0 flex-1 pointer-events-none">
        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0 cursor-grab pointer-events-auto" />
        <IconeArquivo filename={arquivo.original_name} />
        <div className="min-w-0 flex-1 pointer-events-auto">
          <CampoNomeArquivo arquivo={arquivo} isFileSystemSupported={isFileSystemSupported} isReallyDownloaded={isReallyDownloaded} onSalvarNome={onSalvarNome} />
        </div>
      </div>

      <div className="pointer-events-auto">
        <AcoesCardArquivo
          arquivo={arquivo}
          supportsPreview={supportsPreview}
          isFileSystemSupported={isFileSystemSupported}
          isReallyDownloaded={isReallyDownloaded}
          progressoDownload={progressoDownload}
          onPreVisualizar={onPreVisualizar}
          onAlternarOcultar={onAlternarOcultar}
          onExcluirLocal={onExcluirLocal}
          onBaixarLocal={onBaixarLocal}
        />
      </div>
    </div>
  )
}

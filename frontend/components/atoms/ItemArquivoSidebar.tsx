'use client'

import React from 'react'
import { FileText, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'

interface ArquivoMateriaSimples {
  drive_file_id: string
  original_name: string
  custom_name: string | null
  selected_folder: string
  is_ignored?: boolean
}

interface ItemArquivoSidebarProps {
  file: ArquivoMateriaSimples
  onOpenFile: (fileId: string, side?: 'left' | 'right') => void
  leftFileId: string | null
  rightFileId: string | null
  onToggleOcultar?: (fileId: string, isIgnored: boolean) => void
  onReorder?: (draggedId: string, targetId: string) => void
}

export function ItemArquivoSidebar({
  file,
  onOpenFile,
  leftFileId,
  rightFileId,
  onToggleOcultar,
  onReorder
}: ItemArquivoSidebarProps) {
  const isLeftOpen = leftFileId === file.drive_file_id
  const isRightOpen = rightFileId === file.drive_file_id
  const isOpened = isLeftOpen || isRightOpen
  const hasActiveFile = leftFileId !== null || rightFileId !== null

  const lidarComCliqueEsquerda = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenFile(file.drive_file_id, 'left')
  }

  const lidarComCliqueDireita = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenFile(file.drive_file_id, 'right')
  }

  const lidarComCliqueOcultar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleOcultar) {
      onToggleOcultar(file.drive_file_id, !!file.is_ignored)
    }
  }

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', file.drive_file_id)
      }}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        const draggedId = e.dataTransfer.getData('text/plain')
        if (draggedId && draggedId !== file.drive_file_id && onReorder) {
          onReorder(draggedId, file.drive_file_id)
        }
      }}
      onClick={() => onOpenFile(file.drive_file_id)}
      className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 cursor-grab active:cursor-grabbing hover:bg-muted/10 relative group ${
        isOpened
          ? 'bg-primary/5 border-primary shadow-sm'
          : 'bg-background border-border/50 hover:border-border'
      } ${file.is_ignored ? 'opacity-60' : ''}`}
      title="Clique para abrir de forma inteligente, ou use o menu no hover para mais opções"
    >
      <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isOpened ? 'text-primary' : 'text-muted-foreground'}`} />
      
      <span className="text-[11px] font-bold text-foreground leading-relaxed truncate-2-lines flex-1 group-hover:pr-20 transition-all duration-150">
        {file.custom_name || file.original_name}
        {file.is_ignored && (
          <EyeOff className="inline-block w-3 h-3 text-muted-foreground/60 ml-1.5 align-middle shrink-0" />
        )}
      </span>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-background/95 backdrop-blur-sm p-0.5 rounded-lg border border-border shadow-sm animate-in fade-in zoom-in-95 duration-150">
        {hasActiveFile && (
          <>
            <button
              onClick={lidarComCliqueEsquerda}
              className="h-5 w-5 rounded flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground cursor-pointer"
              title="Abrir no painel esquerdo"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={lidarComCliqueDireita}
              className="h-5 w-5 rounded flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground cursor-pointer"
              title="Abrir no painel direito"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3.5 bg-border/40 mx-0.5" />
          </>
        )}

        {onToggleOcultar && (
          <button
            onClick={lidarComCliqueOcultar}
            className="h-5 w-5 rounded flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground cursor-pointer"
            title={file.is_ignored ? 'Mostrar arquivo' : 'Ocultar arquivo'}
          >
            {file.is_ignored ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

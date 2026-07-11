'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, ExternalLink, Trash2, Download, Edit2, Check, X, GripVertical } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { IconeArquivo } from '@/components/atoms/IconeArquivo'
import { StatusArquivo } from '@/components/atoms/StatusArquivo'

interface CardArquivoCompactoProps {
  arquivo: ArquivoClassroom
  categoriaNome: string
  isFileSystemSupported: boolean
  isReallyDownloaded: boolean
  progressoDownload: number | undefined
  onPreVisualizar: (arq: ArquivoClassroom) => void
  onAlternarOcultar: (arq: ArquivoClassroom) => void
  onExcluirLocal: (arq: ArquivoClassroom) => void
  onBaixarLocal: (arq: ArquivoClassroom) => void
  onSalvarNome: (arq: ArquivoClassroom, novoNome: string) => Promise<void>
  onReordenar: (draggedId: string, targetId: string) => void
}

export function CardArquivoCompacto({
  arquivo,
  categoriaNome,
  isFileSystemSupported,
  isReallyDownloaded,
  progressoDownload,
  onPreVisualizar,
  onAlternarOcultar,
  onExcluirLocal,
  onBaixarLocal,
  onSalvarNome,
  onReordenar
}: CardArquivoCompactoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(arquivo.custom_name || arquivo.original_name)
  const [isDragOver, setIsDragOver] = useState(false)

  const lidarComConfirmacaoNome = async () => {
    if (tempName.trim()) {
      await onSalvarNome(arquivo, tempName.trim())
      setIsEditing(false)
    }
  }

  const extension = arquivo.original_name.split('.').pop()?.toLowerCase() || ''
  const supportsPreview = !arquivo.drive_file_id.startsWith('local_') ||
    extension === 'pdf' ||
    ['mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp'].includes(extension)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', arquivo.drive_file_id)
        e.dataTransfer.setData('source-folder', arquivo.selected_folder || categoriaNome)
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
        const draggedId = e.dataTransfer.getData('text/plain')
        const sourceFolder = e.dataTransfer.getData('source-folder')
        if (sourceFolder === (arquivo.selected_folder || categoriaNome) && draggedId !== arquivo.drive_file_id) {
          onReordenar(draggedId, arquivo.drive_file_id)
        }
      }}
      className={`w-full py-3.5 px-4 flex items-center justify-between gap-4 transition-all text-xs text-foreground font-medium rounded-xl border cursor-grab active:cursor-grabbing backdrop-blur-xs ${
        isDragOver 
          ? 'border-t-2 border-t-primary border-r-border/30 border-b-border/30 border-l-border/30 bg-primary/10 scale-[1.005] z-10' 
          : 'border-border/20 bg-card/15 hover:bg-card/30'
      } ${arquivo.is_ignored ? 'opacity-50 bg-muted/5' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0 cursor-grab" />
        <IconeArquivo filename={arquivo.original_name} />
        
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="h-7 px-2 border border-border rounded-lg bg-background text-[11px] font-bold w-48 focus:outline-none text-foreground"
                autoFocus
              />
              <button onClick={lidarComConfirmacaoNome} className="p-1 rounded-md bg-emerald-500 text-white cursor-pointer"><Check className="w-3 h-3" /></button>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded-md bg-muted text-muted-foreground cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/name max-w-xl min-w-0">
              <p className="font-bold text-foreground text-[11px] truncate leading-tight cursor-pointer hover:text-primary transition-colors" onDoubleClick={() => setIsEditing(true)}>
                {arquivo.custom_name || arquivo.original_name}
              </p>
              <button onClick={() => { setTempName(arquivo.custom_name || arquivo.original_name); setIsEditing(true); }} className="opacity-0 group-hover/name:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"><Edit2 className="w-2.5 h-2.5" /></button>
            </div>
          )}
          
          <StatusArquivo isFileSystemSupported={isFileSystemSupported} isReallyDownloaded={isReallyDownloaded} />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {supportsPreview && (
          <button onClick={() => onPreVisualizar(arquivo)} className="p-1.5 border border-border/30 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer" title="Visualizar"><Eye className="w-3.5 h-3.5" /></button>
        )}

        <button onClick={() => onAlternarOcultar(arquivo)} className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${arquivo.is_ignored ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'border-border/30 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground'}`} title={arquivo.is_ignored ? "Mostrar" : "Ocultar"}>
          {arquivo.is_ignored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {!arquivo.drive_file_id.startsWith('local_') && (
          <a href={`https://drive.google.com/file/d/${arquivo.drive_file_id}/view?usp=drivesdk`} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-border/30 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors" title="Google Drive"><ExternalLink className="w-3.5 h-3.5" /></a>
        )}

        {isFileSystemSupported && !arquivo.drive_file_id.startsWith('local_') && !isReallyDownloaded && (
          <button onClick={() => onBaixarLocal(arquivo)} disabled={progressoDownload !== undefined} className="p-1.5 border border-primary/20 bg-primary text-primary-foreground hover:opacity-90 rounded-lg disabled:opacity-80 transition-opacity cursor-pointer flex items-center justify-center relative" title={progressoDownload !== undefined ? `Baixando... ${progressoDownload}%` : "Baixar Offline"}>
            {progressoDownload !== undefined ? (
              <div className="relative flex items-center justify-center w-3.5 h-3.5">
                <svg className="w-3.5 h-3.5 -rotate-90 text-primary-foreground" viewBox="0 0 12 12">
                  <circle stroke="currentColor" fill="transparent" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset={28 - (progressoDownload / 100) * 28} r="4.5" cx="6" cy="6" className="transition-all duration-350" />
                  <circle stroke="currentColor" fill="transparent" strokeWidth="1.5" r="4.5" cx="6" cy="6" className="opacity-20" />
                </svg>
              </div>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {isFileSystemSupported && isReallyDownloaded && (
          <button onClick={() => onExcluirLocal(arquivo)} className="p-1.5 border border-border/30 bg-background/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer" title="Excluir Local"><Trash2 className="w-3.5 h-3.5" /></button>
        )}
      </div>
    </div>
  )
}

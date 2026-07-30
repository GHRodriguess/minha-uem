'use client'

import React from 'react'
import { X, FileText, Video, FileCode, FileEdit, AlertCircle } from 'lucide-react'
import { PainelPDF } from './PainelPDF'
import { VisualizadorVideo } from './VisualizadorVideo'
import { VisualizadorTexto } from './VisualizadorTexto'
import { VisualizadorWord } from './VisualizadorWord'
import { obterNomeExibicao, obterNomeComExtensao } from '@/lib/utils/formatadorNomeArquivo'

interface ItemArquivoUnificado {
  drive_file_id: string
  original_name: string
  custom_name: string | null
  selected_folder: string
  local_path?: string | null
  video_tipo?: 'drive' | 'youtube'
}

interface PainelVisualizadorProps {
  file: ItemArquivoUnificado | null
  fileUrl: string | null
  onClose?: () => void
  canClose?: boolean
  side?: 'left' | 'right'
  isLoading?: boolean
  onDropFile?: (fileId: string, side: 'left' | 'right') => void
  onDropLocalFile?: (file: File, side: 'left' | 'right') => void
}

export function obterTipoVisualizador(nome: string, videoTipo?: string) {
  if (videoTipo) return 'video'
  const ext = nome.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp'].includes(ext)) return 'video'
  if (['txt', 'py', 'js', 'ts', 'html', 'css', 'json', 'md', 'java', 'cpp', 'c', 'sql', 'sh', 'yml', 'yaml'].includes(ext)) return 'text'
  if (['doc', 'docx'].includes(ext)) return 'word'
  return 'unsupported'
}

export function PainelVisualizador({
  file,
  fileUrl,
  onClose,
  canClose = false,
  side = 'left',
  isLoading = false,
  onDropFile,
  onDropLocalFile
}: PainelVisualizadorProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background border border-border/30 rounded-2xl p-6 gap-3 animate-pulse">
        <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Carregando Arquivo...
        </span>
      </div>
    )
  }
  if (fileUrl === 'failed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background border border-border/30 rounded-2xl p-6 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
        <span className="text-xs font-bold text-foreground uppercase">
          Erro ao carregar arquivo
        </span>
        <span className="text-[10px] text-muted-foreground">
          Ocorreu um problema ao baixar ou ler o arquivo localmente.
        </span>
      </div>
    )
  }
  if (!file) {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropLocalFile) {
            onDropLocalFile(e.dataTransfer.files[0], side)
          } else if (onDropFile) {
            const fileId = e.dataTransfer.getData('text/plain')
            if (fileId) onDropFile(fileId, side)
          }
        }}
        className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-muted/10 border border-dashed border-border/60 rounded-2xl select-none"
      >
        <p className="text-xs font-bold text-muted-foreground">Nenhum arquivo selecionado</p>
        <p className="text-[10px] text-muted-foreground/80 mt-1">
          Arraste um arquivo aqui ou utilize a barra lateral.
        </p>
      </div>
    )
  }

  const type = obterTipoVisualizador(file.original_name, file.video_tipo)

  if (type === 'pdf') {
    return (
      <PainelPDF
        fileUrl={fileUrl}
        onClose={onClose}
        canClose={canClose}
        side={side}
        isLoading={isLoading}
      />
    )
  }

  const obterIconeCabecalho = () => {
    if (type === 'video') return <Video className="w-4 h-4 text-primary" />
    if (type === 'text') return <FileCode className="w-4 h-4 text-primary" />
    if (type === 'word') return <FileEdit className="w-4 h-4 text-primary" />
    return <FileText className="w-4 h-4 text-primary" />
  }

  const obterEmbedUrl = () => {
    if (file.video_tipo === 'youtube') {
      return `https://www.youtube.com/embed/${file.drive_file_id}?autoplay=1`
    }
    return `https://drive.google.com/file/d/${file.drive_file_id}/preview`
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden relative border border-border/30 rounded-2xl shadow-sm">
      <header className="h-14 px-4 border-b border-border bg-card/75 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-4">
          {obterIconeCabecalho()}
          <span className="text-xs font-bold text-foreground truncate uppercase tracking-wide">
            {obterNomeExibicao(file.custom_name, file.original_name)}
          </span>
        </div>

        {canClose && onClose && (
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-muted/5">
        {type === 'video' && (
          <VisualizadorVideo
            embedUrl={file.video_tipo ? obterEmbedUrl() : null}
            localUrl={fileUrl}
          />
        )}
        {type === 'text' && <VisualizadorTexto fileUrl={fileUrl} />}
        {type === 'word' && (
          <VisualizadorWord
            driveFileId={file.drive_file_id}
            originalName={file.original_name}
            localUrl={fileUrl}
          />
        )}
        {type === 'unsupported' && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-warning" />
            <p className="text-xs font-bold text-foreground uppercase">Formato não suportado</p>
            {fileUrl && (
              <a
                href={fileUrl}
                download={obterNomeComExtensao(file.custom_name || file.original_name, file.original_name)}
                className="h-9 px-4 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                Download do Arquivo
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

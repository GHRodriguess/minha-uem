'use client'

import React from 'react'
import { X, ExternalLink, Download } from 'lucide-react'
import { IconeArquivo } from '@/components/atoms/IconeArquivo'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { obterNomeExibicao } from '@/lib/utils/formatadorNomeArquivo'

interface ModalVisualizadorIframeProps {
  arquivo: ArquivoClassroom | null
  onClose: () => void
  onDownload: (arq: ArquivoClassroom) => Promise<void>
  isFileSystemSupported: boolean
}

export function ModalVisualizadorIframe({
  arquivo,
  onClose,
  onDownload,
  isFileSystemSupported
}: ModalVisualizadorIframeProps) {
  if (!arquivo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-background border border-border rounded-xl">
              <IconeArquivo filename={arquivo.original_name} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{obterNomeExibicao(arquivo.custom_name, arquivo.original_name)}</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Pré-visualização do Documento
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 bg-muted/5 p-4 relative">
          <iframe
            src={`https://drive.google.com/file/d/${arquivo.drive_file_id}/preview`}
            className="w-full h-full border-0 rounded-2xl bg-background"
            allow="autoplay"
          />
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-xs">
            ID: {arquivo.drive_file_id}
          </div>
          
          <div className="flex gap-2">
            <a
              href={`https://drive.google.com/file/d/${arquivo.drive_file_id}/view?usp=drivesdk`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 h-9 px-4 border border-border bg-background hover:bg-muted rounded-xl text-xs font-bold text-muted-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir no Drive
            </a>

            {isFileSystemSupported && !arquivo.drive_file_id.startsWith('local_') && (
              <button
                onClick={() => { onDownload(arquivo); onClose(); }}
                className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold shadow-sm transition-opacity cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arquivo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

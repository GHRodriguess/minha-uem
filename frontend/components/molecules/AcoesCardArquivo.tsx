'use client'

import React from 'react'
import { Eye, EyeOff, ExternalLink, Trash2, Download } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'

interface AcoesCardArquivoProps {
  arquivo: ArquivoClassroom
  supportsPreview: boolean
  isFileSystemSupported: boolean
  isReallyDownloaded: boolean
  progressoDownload: number | undefined
  onPreVisualizar: (arq: ArquivoClassroom) => void
  onAlternarOcultar: (arq: ArquivoClassroom) => void
  onExcluirLocal: (arq: ArquivoClassroom) => void
  onBaixarLocal: (arq: ArquivoClassroom) => void
}

export function AcoesCardArquivo({
  arquivo,
  supportsPreview,
  isFileSystemSupported,
  isReallyDownloaded,
  progressoDownload,
  onPreVisualizar,
  onAlternarOcultar,
  onExcluirLocal,
  onBaixarLocal
}: AcoesCardArquivoProps) {
  const isLocal = arquivo.drive_file_id.startsWith('local_')
  const btnClass = 'p-1.5 border border-border/30 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer'

  return (
    <div className="flex items-center gap-2 shrink-0">
      {supportsPreview && (
        <button onClick={() => onPreVisualizar(arquivo)} className={btnClass} title="Visualizar">
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        onClick={() => onAlternarOcultar(arquivo)}
        className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
          arquivo.is_ignored ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : btnClass
        }`}
        title={arquivo.is_ignored ? 'Mostrar' : 'Ocultar'}
      >
        {arquivo.is_ignored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {!isLocal && (
        <a href={`https://drive.google.com/file/d/${arquivo.drive_file_id}/view?usp=drivesdk`} target="_blank" rel="noopener noreferrer" className={btnClass} title="Google Drive">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {isFileSystemSupported && !isLocal && !isReallyDownloaded && (
        <button
          onClick={() => onBaixarLocal(arquivo)}
          disabled={progressoDownload !== undefined}
          className="p-1.5 border border-primary/20 bg-primary text-primary-foreground hover:opacity-90 rounded-lg disabled:opacity-80 transition-opacity cursor-pointer flex items-center justify-center relative"
          title={progressoDownload !== undefined ? `Baixando... ${progressoDownload}%` : 'Baixar Offline'}
        >
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
        <button onClick={() => onExcluirLocal(arquivo)} className="p-1.5 border border-border/30 bg-background/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer" title="Excluir Local">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

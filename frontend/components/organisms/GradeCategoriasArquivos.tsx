'use client'

import React from 'react'
import { FolderOpen } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { CardArquivoCompacto } from '@/components/molecules/CardArquivoCompacto'

interface GradeCategoriasArquivosProps {
  arquivosOrdenados: ArquivoClassroom[]
  listaCategorias: string[]
  missingFiles: Record<string, boolean>
  hasFolderPermission: boolean
  isFileSystemSupported: boolean
  downloadProgress: Record<string, number>
  onPreVisualizar: (arq: ArquivoClassroom) => void
  onAlternarOcultar: (arq: ArquivoClassroom) => void
  onExcluirLocal: (arq: ArquivoClassroom) => void
  onBaixarLocal: (arq: ArquivoClassroom) => void
  onSalvarNome: (arq: ArquivoClassroom, novoNome: string) => Promise<void>
  onAlterarPastaDestino: (arq: ArquivoClassroom, novaPasta: string) => Promise<void>
  onReordenarManual: (draggedId: string, targetId: string) => void
}

export function GradeCategoriasArquivos({
  arquivosOrdenados,
  listaCategorias,
  missingFiles,
  hasFolderPermission,
  isFileSystemSupported,
  downloadProgress,
  onPreVisualizar,
  onAlternarOcultar,
  onExcluirLocal,
  onBaixarLocal,
  onSalvarNome,
  onAlterarPastaDestino,
  onReordenarManual
}: GradeCategoriasArquivosProps) {
  
  const [dragOverCategory, setDragOverCategory] = React.useState<string | null>(null)

  const formatarNomePasta = (nome: string) => {
    if (nome === 'documentos') return 'Documentos'
    if (nome === 'exercicios') return 'Exercícios'
    return nome.charAt(0).toUpperCase() + nome.slice(1)
  }

  const lidarComDropPasta = async (e: React.DragEvent, destino: string) => {
    e.preventDefault()
    const fileId = e.dataTransfer.getData('text/plain')
    const sourceFolder = e.dataTransfer.getData('source-folder')
    if (sourceFolder && sourceFolder !== destino) {
      const arq = arquivosOrdenados.find(a => a.drive_file_id === fileId)
      if (arq) {
        await onAlterarPastaDestino(arq, destino)
      }
    }
  }

  const allCategories = [...listaCategorias, 'outros']

  return (
    <div className="space-y-6">
      {allCategories.map((cat) => {
        const categoryFiles = arquivosOrdenados.filter((arq) => {
          if (cat === 'outros') {
            return !arq.selected_folder || !listaCategorias.includes(arq.selected_folder)
          }
          return arq.selected_folder === cat
        })

        if (cat === 'outros' && categoryFiles.length === 0) return null

        return (
          <div
            key={cat}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragOverCategory(cat)
            }}
            onDragLeave={() => setDragOverCategory(null)}
            onDrop={async (e) => {
              setDragOverCategory(null)
              await lidarComDropPasta(e, cat)
            }}
            className={`bg-card/25 backdrop-blur-md border rounded-2xl p-4 transition-all ${
              dragOverCategory === cat ? 'border-primary bg-primary/10 scale-[1.002] z-10' : 'border-border/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                {cat === 'outros' ? 'Sem Categoria' : formatarNomePasta(cat)}
              </h3>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
                {categoryFiles.length}
              </span>
            </div>

            {categoryFiles.length === 0 ? (
              <div className="border border-dashed border-border/60 rounded-xl py-6 text-center text-muted-foreground/60 text-[10px] font-semibold">
                Arraste arquivos aqui para mover para esta pasta
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {categoryFiles.map((arq) => {
                  const isDownloaded = hasFolderPermission
                    ? !missingFiles[arq.drive_file_id]
                    : localStorage.getItem('baixado_' + arq.drive_file_id) === 'true'

                  return (
                    <CardArquivoCompacto
                      key={arq.drive_file_id}
                      arquivo={arq}
                      categoriaNome={cat}
                      isFileSystemSupported={isFileSystemSupported}
                      isReallyDownloaded={isDownloaded}
                      progressoDownload={downloadProgress[arq.drive_file_id]}
                      onPreVisualizar={onPreVisualizar}
                      onAlternarOcultar={onAlternarOcultar}
                      onExcluirLocal={onExcluirLocal}
                      onBaixarLocal={onBaixarLocal}
                      onSalvarNome={onSalvarNome}
                      onReordenar={onReordenarManual}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

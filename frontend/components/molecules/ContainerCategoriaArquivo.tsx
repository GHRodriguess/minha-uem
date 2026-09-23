'use client'

import React, { useState, useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { CardArquivoCompacto } from '@/components/molecules/CardArquivoCompacto'

interface ContainerCategoriaArquivoProps {
  categoria: string
  arquivos: ArquivoClassroom[]
  missingFiles: Record<string, boolean>
  hasFolderPermission: boolean
  isFileSystemSupported: boolean
  downloadProgress: Record<string, number>
  activeDraggedId: string | null
  onPreVisualizar: (arq: ArquivoClassroom) => void
  onAlternarOcultar: (arq: ArquivoClassroom) => void
  onExcluirLocal: (arq: ArquivoClassroom) => void
  onBaixarLocal: (arq: ArquivoClassroom) => void
  onSalvarNome: (arq: ArquivoClassroom, novoNome: string) => Promise<void>
  onMoverArquivo: (draggedId: string, targetId: string | null, posicao: 'antes' | 'depois' | 'fim', categoriaDestino: string) => void
  onDefinirArquivoArrastando: (draggedId: string | null) => void
}

export function ContainerCategoriaArquivo(props: ContainerCategoriaArquivoProps) {
  const { categoria, arquivos, missingFiles, hasFolderPermission, isFileSystemSupported, downloadProgress, activeDraggedId, onPreVisualizar, onAlternarOcultar, onExcluirLocal, onBaixarLocal, onSalvarNome, onMoverArquivo, onDefinirArquivoArrastando } = props
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (!activeDraggedId) setIsDragOver(false)
  }, [activeDraggedId])

  const nomePasta = categoria === 'outros' ? 'Sem Categoria' :
    categoria === 'documentos' ? 'Documentos' :
    categoria === 'exercicios' ? 'Exercícios' :
    categoria.charAt(0).toUpperCase() + categoria.slice(1)

  const lidarComDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDefinirArquivoArrastando(null)
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId) onMoverArquivo(draggedId, null, 'fim', categoria)
  }

  const dragAtivo = isDragOver && !!activeDraggedId

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDragEnter={(e) => { e.preventDefault(); if (activeDraggedId) setIsDragOver(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragOver(false) }}
      onDrop={lidarComDrop}
      className={`bg-card/25 backdrop-blur-md border rounded-2xl p-4 transition-all duration-150 ${
        dragAtivo ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'border-border/30'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-2">
        <FolderOpen className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">{nomePasta}</h3>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">{arquivos.length}</span>
      </div>

      {arquivos.length === 0 ? (
        <div className={`border border-dashed rounded-xl py-6 text-center text-[10px] font-semibold transition-colors ${
          dragAtivo ? 'border-primary bg-primary/15 text-primary' : 'border-border/60 text-muted-foreground/60'
        }`}>
          {dragAtivo ? `Solte aqui para mover para ${nomePasta}` : 'Arraste arquivos aqui para mover para esta pasta'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {arquivos.map((arq) => (
            <CardArquivoCompacto
              key={arq.drive_file_id}
              arquivo={arq}
              categoriaNome={categoria}
              isFileSystemSupported={isFileSystemSupported}
              isReallyDownloaded={hasFolderPermission ? !missingFiles[arq.drive_file_id] : localStorage.getItem('baixado_' + arq.drive_file_id) === 'true'}
              progressoDownload={downloadProgress[arq.drive_file_id]}
              activeDraggedId={activeDraggedId}
              onPreVisualizar={onPreVisualizar}
              onAlternarOcultar={onAlternarOcultar}
              onExcluirLocal={onExcluirLocal}
              onBaixarLocal={onBaixarLocal}
              onSalvarNome={onSalvarNome}
              onMoverArquivo={onMoverArquivo}
              onDefinirArquivoArrastando={onDefinirArquivoArrastando}
            />
          ))}
        </div>
      )}
    </div>
  )
}

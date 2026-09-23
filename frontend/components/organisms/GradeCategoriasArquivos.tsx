'use client'

import React, { useState, useEffect } from 'react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { ContainerCategoriaArquivo } from '@/components/molecules/ContainerCategoriaArquivo'

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
  onMoverArquivo: (draggedId: string, targetId: string | null, posicao: 'antes' | 'depois' | 'fim', categoriaDestino: string) => void
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
  onMoverArquivo
}: GradeCategoriasArquivosProps) {
  const [activeDraggedId, setActiveDraggedId] = useState<string | null>(null)

  useEffect(() => {
    const limparArrasteGlobal = () => setActiveDraggedId(null)
    window.addEventListener('dragend', limparArrasteGlobal)
    window.addEventListener('drop', limparArrasteGlobal)
    return () => {
      window.removeEventListener('dragend', limparArrasteGlobal)
      window.removeEventListener('drop', limparArrasteGlobal)
    }
  }, [])

  const lidarComMover = (
    draggedId: string,
    targetId: string | null,
    posicao: 'antes' | 'depois' | 'fim',
    categoriaDestino: string
  ) => {
    setActiveDraggedId(null)
    onMoverArquivo(draggedId, targetId, posicao, categoriaDestino)
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
          <ContainerCategoriaArquivo
            key={cat}
            categoria={cat}
            arquivos={categoryFiles}
            missingFiles={missingFiles}
            hasFolderPermission={hasFolderPermission}
            isFileSystemSupported={isFileSystemSupported}
            downloadProgress={downloadProgress}
            activeDraggedId={activeDraggedId}
            onPreVisualizar={onPreVisualizar}
            onAlternarOcultar={onAlternarOcultar}
            onExcluirLocal={onExcluirLocal}
            onBaixarLocal={onBaixarLocal}
            onSalvarNome={onSalvarNome}
            onMoverArquivo={lidarComMover}
            onDefinirArquivoArrastando={setActiveDraggedId}
          />
        )
      })}
    </div>
  )
}

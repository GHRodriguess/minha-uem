'use client'

import { useState, DragEvent } from 'react'
import { ArquivoClassroom } from '@/lib/api/classroom'

interface UseCardArrasteArquivoProps {
  arquivo: ArquivoClassroom
  categoriaNome: string
  activeDraggedId: string | null
  onMoverArquivo: (draggedId: string, targetId: string | null, posicao: 'antes' | 'depois' | 'fim', categoriaDestino: string) => void
  onDefinirArquivoArrastando: (draggedId: string | null) => void
}

export function useCardArrasteArquivo({
  arquivo,
  categoriaNome,
  activeDraggedId,
  onMoverArquivo,
  onDefinirArquivoArrastando
}: UseCardArrasteArquivoProps) {
  const [dropPosition, setDropPosition] = useState<'antes' | 'depois' | null>(null)
  const isBeingDragged = activeDraggedId === arquivo.drive_file_id

  const lidarComDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', arquivo.drive_file_id)
    e.dataTransfer.setData('source-folder', arquivo.selected_folder || (categoriaNome === 'outros' ? '' : categoriaNome))
    onDefinirArquivoArrastando(arquivo.drive_file_id)
  }

  const lidarComDragEnd = () => {
    onDefinirArquivoArrastando(null)
    setDropPosition(null)
  }

  const lidarComDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isBeingDragged) return
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const middleY = rect.top + rect.height / 2
    const nextPosition = e.clientY < middleY ? 'antes' : 'depois'
    if (dropPosition !== nextPosition) {
      setDropPosition(nextPosition)
    }
  }

  const lidarComDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDropPosition(null)
    }
  }

  const lidarComDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const currentPosition = dropPosition || 'antes'
    setDropPosition(null)
    onDefinirArquivoArrastando(null)
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && draggedId !== arquivo.drive_file_id) {
      onMoverArquivo(draggedId, arquivo.drive_file_id, currentPosition, categoriaNome)
    }
  }

  return {
    isBeingDragged,
    dropPosition,
    lidarComDragStart,
    lidarComDragEnd,
    lidarComDragOver,
    lidarComDragLeave,
    lidarComDrop
  }
}

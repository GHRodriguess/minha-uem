'use client'

import React from 'react'
import { ArquivoClassroom } from '@/lib/api/classroom'

interface UseMovimentacaoArquivosProps {
  materiaId: number
  arquivosOrdenados: ArquivoClassroom[]
  listaCategorias: string[]
  setOrdemManualVersao: React.Dispatch<React.SetStateAction<number>>
  alterarPasta: (arq: ArquivoClassroom, novaPasta: string) => Promise<void>
}

export function useMovimentacaoArquivos({
  materiaId,
  arquivosOrdenados,
  listaCategorias,
  setOrdemManualVersao,
  alterarPasta
}: UseMovimentacaoArquivosProps) {
  const lidarComMovimentacaoArquivo = async (
    draggedId: string,
    targetId: string | null,
    posicao: 'antes' | 'depois' | 'fim',
    categoriaDestino: string
  ) => {
    const list = [...arquivosOrdenados]
    const idxDragged = list.findIndex(f => f.drive_file_id === draggedId)
    if (idxDragged === -1) return
    const [draggedItem] = list.splice(idxDragged, 1)

    if (targetId) {
      const idxTarget = list.findIndex(f => f.drive_file_id === targetId)
      if (idxTarget !== -1) {
        const insertIndex = posicao === 'depois' ? idxTarget + 1 : idxTarget
        list.splice(insertIndex, 0, draggedItem)
      } else {
        list.push(draggedItem)
      }
    } else {
      let lastIndex = -1
      for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i]
        const match = categoriaDestino === 'outros'
          ? (!item.selected_folder || !listaCategorias.includes(item.selected_folder))
          : item.selected_folder === categoriaDestino
        if (match) {
          lastIndex = i
          break
        }
      }
      if (lastIndex !== -1) {
        list.splice(lastIndex + 1, 0, draggedItem)
      } else {
        list.push(draggedItem)
      }
    }

    localStorage.setItem(`minha_uem_visualizador_ordem_${materiaId}`, JSON.stringify(list.map(f => f.drive_file_id)))
    setOrdemManualVersao(v => v + 1)

    const pastaDestinoFinal = categoriaDestino === 'outros' ? '' : categoriaDestino
    const pastaAtual = draggedItem.selected_folder || ''
    if (pastaAtual !== pastaDestinoFinal) {
      await alterarPasta(draggedItem, pastaDestinoFinal)
    }
  }

  return { lidarComMovimentacaoArquivo }
}

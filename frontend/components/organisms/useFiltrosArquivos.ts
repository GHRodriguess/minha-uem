'use client'

import { useState, useMemo } from 'react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { obterNomeExibicao } from '@/lib/utils/formatadorNomeArquivo'

interface UseFiltrosArquivosProps {
  arquivos: ArquivoClassroom[]
  materiaId: number
  isFileSystemSupported: boolean
  hasFolderPermission: boolean
  missingFiles: Record<string, boolean>
}

export function useFiltrosArquivos({
  arquivos,
  materiaId,
  isFileSystemSupported,
  hasFolderPermission,
  missingFiles
}: UseFiltrosArquivosProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedExtension, setSelectedExtension] = useState('todos')
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [mostrarOcultados, setMostrarOcultados] = useState(false)
  const [ordemManualVersao, setOrdemManualVersao] = useState(0)

  const categorizarExt = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf') return 'pdf'
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'planilha'
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'imagem'
    if (['doc', 'docx', 'odt', 'txt'].includes(ext)) return 'documento'
    if (['mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp'].includes(ext)) return 'video'
    if (['py', 'js', 'ts', 'html', 'css', 'json', 'md', 'java', 'cpp', 'c', 'sql', 'sh', 'yml', 'yaml'].includes(ext)) return 'codigo'
    return 'outro'
  }

  const arquivosFiltrados = useMemo(() => {
    return arquivos.filter(arq => {
      if (!isFileSystemSupported && arq.drive_file_id.startsWith('local_')) return false
      
      const fileTitle = obterNomeExibicao(arq.custom_name, arq.original_name).toLowerCase()
      const matchSearch = fileTitle.includes(searchText.toLowerCase()) || arq.original_name.toLowerCase().includes(searchText.toLowerCase())
      
      const matchExt = selectedExtension === 'todos' || categorizarExt(arq.original_name) === selectedExtension
      
      const isDownloaded = hasFolderPermission
        ? !missingFiles[arq.drive_file_id]
        : localStorage.getItem('baixado_' + arq.drive_file_id) === 'true'

      const matchStatus = selectedStatus === 'todos' || 
        (selectedStatus === 'baixados' && isDownloaded) ||
        (selectedStatus === 'pendentes' && !isDownloaded)

      const matchIgnored = mostrarOcultados ? true : !arq.is_ignored

      return matchSearch && matchExt && matchStatus && matchIgnored
    })
  }, [arquivos, searchText, selectedExtension, selectedStatus, mostrarOcultados, isFileSystemSupported, hasFolderPermission, missingFiles])

  const arquivosOrdenados = useMemo(() => {
    return [...arquivosFiltrados].sort((a, b) => {
      const stored = localStorage.getItem(`minha_uem_visualizador_ordem_${materiaId}`)
      if (stored) {
        try {
          const orderedIds: string[] = JSON.parse(stored)
          const idxA = orderedIds.indexOf(a.drive_file_id)
          const idxB = orderedIds.indexOf(b.drive_file_id)
          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return -1
          if (idxB !== -1) return 1
        } catch {
          localStorage.removeItem(`minha_uem_visualizador_ordem_${materiaId}`)
        }
      }
      return obterNomeExibicao(a.custom_name, a.original_name).toLowerCase().localeCompare(obterNomeExibicao(b.custom_name, b.original_name).toLowerCase(), 'pt-BR')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivosFiltrados, materiaId, ordemManualVersao])

  const limparFiltros = () => {
    setSearchText('')
    setSelectedExtension('todos')
    setSelectedStatus('todos')
    setMostrarOcultados(false)
  }

  const temFiltros = searchText !== '' || selectedExtension !== 'todos' || selectedStatus !== 'todos' || mostrarOcultados

  return {
    searchText,
    setSearchText,
    selectedExtension,
    setSelectedExtension,
    selectedStatus,
    setSelectedStatus,
    mostrarOcultados,
    setMostrarOcultados,
    ordemManualVersao,
    setOrdemManualVersao,
    arquivosOrdenados,
    limparFiltros,
    temFiltros
  }
}

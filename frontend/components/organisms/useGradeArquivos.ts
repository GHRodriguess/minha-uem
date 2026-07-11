'use client'

import { useMemo } from 'react'
import { StatusVinculoClassroom } from '@/lib/api/classroom'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useSincronizacaoLocal } from './useSincronizacaoLocal'
import { useFiltrosArquivos } from './useFiltrosArquivos'
import { useAcoesArquivos } from './useAcoesArquivos'

export function useGradeArquivos(materiaId: number, anoId: number, dadosVinculo: StatusVinculoClassroom) {
  const classroom = useClassroom()

  const filesHash = useMemo(() => {
    if (!dadosVinculo?.arquivos) return ''
    return JSON.stringify(dadosVinculo.arquivos.map(a => [a.drive_file_id, a.custom_name, a.original_name, a.selected_folder, a.local_path]))
  }, [dadosVinculo?.arquivos])

  const { missingFiles, setMissingFiles } = useSincronizacaoLocal({
    materiaId,
    anoId,
    dadosVinculo,
    directoryHandle: classroom.directoryHandle,
    hasFolderPermission: classroom.hasFolderPermission,
    escanearPastaLocal: classroom.escanearPastaLocal,
    filesHash
  })

  const filtros = useFiltrosArquivos({
    arquivos: dadosVinculo.arquivos || [],
    materiaId,
    isFileSystemSupported: classroom.isFileSystemSupported,
    hasFolderPermission: classroom.hasFolderPermission,
    missingFiles
  })

  const acoes = useAcoesArquivos({
    materiaId,
    anoId,
    dadosVinculo,
    directoryHandle: classroom.directoryHandle,
    hasFolderPermission: classroom.hasFolderPermission,
    escanearPastaLocal: classroom.escanearPastaLocal,
    baixarItem: classroom.baixarItem,
    salvarNomePersonalizado: classroom.salvarNomePersonalizado,
    salvarPastaDestino: classroom.salvarPastaDestino,
    alternarOcultarArquivo: classroom.alternarOcultarArquivo,
    enviarArquivoLocal: classroom.enviarArquivoLocal,
    setMissingFiles
  })

  return {
    classroom,
    missingFiles,
    filtros,
    acoes
  }
}

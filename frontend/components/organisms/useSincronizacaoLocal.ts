'use client'

import { useState, useEffect } from 'react'
import { StatusVinculoClassroom } from '@/lib/api/classroom'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'
import { obterNomeComExtensao } from '@/lib/utils/formatadorNomeArquivo'

interface UseSincronizacaoLocalProps {
  materiaId: number
  anoId: number
  dadosVinculo: StatusVinculoClassroom
  directoryHandle: FileSystemDirectoryHandle | null
  hasFolderPermission: boolean
  escanearPastaLocal: (materiaId: number, anoId: number) => Promise<void>
  filesHash: string
}

export function useSincronizacaoLocal({
  materiaId,
  anoId,
  dadosVinculo,
  directoryHandle,
  hasFolderPermission,
  escanearPastaLocal,
  filesHash
}: UseSincronizacaoLocalProps) {
  const [missingFiles, setMissingFiles] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!directoryHandle || !hasFolderPermission || !dadosVinculo?.arquivos) return

    let active = true
    const verificarFisico = async () => {
      const missing: Record<string, boolean> = {}
      const courseName = dadosVinculo.curso_nome || "Sem_Curso"
      const year = dadosVinculo.ano_letivo || ""
      const subjectName = dadosVinculo.materia_nome || ""

      for (const arq of dadosVinculo.arquivos) {
        const folder = arq.selected_folder || "documentos"
        const parts = ['UEM', 'Cursos', courseName, year, subjectName, folder]
        const fileName = obterNomeComExtensao(arq.custom_name || arq.original_name, arq.original_name)
        
        try {
          const exists = await GerenciadorDiretorio.verificarArquivoExiste(directoryHandle, parts, fileName)
          if (exists) {
            localStorage.setItem('baixado_' + arq.drive_file_id, 'true')
          } else {
            localStorage.removeItem('baixado_' + arq.drive_file_id)
            missing[arq.drive_file_id] = true
          }
        } catch {
          localStorage.removeItem('baixado_' + arq.drive_file_id)
          missing[arq.drive_file_id] = true
        }
      }
      if (active) {
        setMissingFiles(missing)
      }
    }

    verificarFisico()
    return () => { active = false }
  }, [filesHash, dadosVinculo, directoryHandle, hasFolderPermission])

  useEffect(() => {
    if (!directoryHandle || !hasFolderPermission) return

    const lidarFoco = () => {
      escanearPastaLocal(materiaId, anoId).catch(console.error)
    }

    window.addEventListener('focus', lidarFoco)
    return () => window.removeEventListener('focus', lidarFoco)
  }, [materiaId, anoId, directoryHandle, hasFolderPermission, escanearPastaLocal])

  return { missingFiles, setMissingFiles }
}

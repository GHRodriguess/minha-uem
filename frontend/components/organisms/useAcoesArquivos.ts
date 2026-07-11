'use client'

import React, { useState } from 'react'
import { StatusVinculoClassroom, ArquivoClassroom } from '@/lib/api/classroom'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'

export function useAcoesArquivos({
  materiaId,
  anoId,
  dadosVinculo,
  directoryHandle,
  hasFolderPermission,
  escanearPastaLocal,
  baixarItem,
  salvarNomePersonalizado,
  salvarPastaDestino,
  alternarOcultarArquivo,
  enviarArquivoLocal,
  setMissingFiles
}: {
  materiaId: number
  anoId: number
  dadosVinculo: StatusVinculoClassroom
  directoryHandle: FileSystemDirectoryHandle | null
  hasFolderPermission: boolean
  escanearPastaLocal: (materiaId: number, anoId: number) => Promise<void>
  baixarItem: (mId: number, aId: number, fileId: string, name: string) => Promise<void>
  salvarNomePersonalizado: (mId: number, aId: number, fileId: string, orig: string, custom: string) => Promise<void>
  salvarPastaDestino: (mId: number, aId: number, fileId: string, orig: string, folder: string) => Promise<void>
  alternarOcultarArquivo: (mId: number, aId: number, fileId: string, orig: string, hide: boolean) => Promise<void>
  enviarArquivoLocal: (mId: number, aId: number, folder: string, file: File) => Promise<void>
  setMissingFiles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  const [arquivoParaExcluir, setArquivoParaExcluir] = useState<ArquivoClassroom | null>(null)
  const [uploadModalAberto, setUploadModalAberto] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  const gerenciarDownload = async (arq: ArquivoClassroom) => {
    const fileId = arq.drive_file_id
    setDownloadProgress(prev => ({ ...prev, [fileId]: 5 }))
    
    const intervalId = setInterval(() => {
      setDownloadProgress(prev => {
        const current = prev[fileId]
        if (current === undefined) return prev
        if (current >= 95) {
          clearInterval(intervalId)
          return prev
        }
        return { ...prev, [fileId]: Math.min(95, current + Math.floor(Math.random() * 8) + 4) }
      })
    }, 120)

    try {
      await baixarItem(materiaId, anoId, arq.drive_file_id, arq.original_name)
      clearInterval(intervalId)
      setDownloadProgress(prev => ({ ...prev, [fileId]: 100 }))
      
      setTimeout(() => {
        setDownloadProgress(prev => {
          const next = { ...prev }; delete next[fileId]; return next
        })
      }, 700)

      localStorage.setItem('baixado_' + arq.drive_file_id, 'true')
      setMissingFiles(prev => {
        const next = { ...prev }; delete next[arq.drive_file_id]; return next
      })
    } catch (e) {
      clearInterval(intervalId)
      setDownloadProgress(prev => {
        const next = { ...prev }; delete next[fileId]; return next
      })
      console.error(e)
    }
  }

  const confirmarExclusaoFisica = async () => {
    if (!arquivoParaExcluir || !directoryHandle || !hasFolderPermission || !dadosVinculo) return
    try {
      const courseName = dadosVinculo.curso_nome || "Sem_Curso"
      const year = dadosVinculo.ano_letivo || ""
      const subjectName = dadosVinculo.materia_nome || ""
      const folder = arquivoParaExcluir.selected_folder || "documentos"
      const parts = ['UEM', 'Cursos', courseName, year, subjectName, folder]
      
      const success = await GerenciadorDiretorio.removerArquivoLocal(directoryHandle, parts, arquivoParaExcluir.custom_name || arquivoParaExcluir.original_name)
      if (success) {
        localStorage.removeItem('baixado_' + arquivoParaExcluir.drive_file_id)
        await escanearPastaLocal(materiaId, anoId)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setArquivoParaExcluir(null)
    }
  }

  const gerenciarUploadLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return
    setEnviando(true)
    try {
      const category = uploadCategory || 'documentos'
      await enviarArquivoLocal(materiaId, anoId, category, uploadFile)
      setUploadModalAberto(false)
      setUploadFile(null)
    } catch (e) {
      console.error(e)
    } finally {
      setEnviando(false)
    }
  }

  const alterarPasta = async (arq: ArquivoClassroom, novaPasta: string) => {
    await salvarPastaDestino(materiaId, anoId, arq.drive_file_id, arq.original_name, novaPasta)
  }

  const alternarOcultar = async (arq: ArquivoClassroom) => {
    await alternarOcultarArquivo(materiaId, anoId, arq.drive_file_id, arq.original_name, !arq.is_ignored)
  }

  const salvarNome = async (arq: ArquivoClassroom, novoNome: string) => {
    await salvarNomePersonalizado(materiaId, anoId, arq.drive_file_id, arq.original_name, novoNome)
  }

  return {
    downloadProgress,
    arquivoParaExcluir,
    setArquivoParaExcluir,
    uploadModalAberto,
    setUploadModalAberto,
    uploadCategory,
    setUploadCategory,
    uploadFile,
    setUploadFile,
    enviando,
    gerenciarDownload,
    confirmarExclusaoFisica,
    gerenciarUploadLocal,
    alterarPasta,
    alternarOcultar,
    salvarNome
  }
}

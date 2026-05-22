'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  classroom_service, 
  ConfiguracaoClassroom, 
  ArquivoClassroom, 
  StatusVinculoClassroom 
} from '@/lib/api/classroom'

interface ContextoClassroomData {
  filesCache: Record<number, StatusVinculoClassroom>
  classroomConfig: ConfiguracaoClassroom | null
  loadingStates: Record<number, boolean>
  syncingStates: Record<number, boolean>
  obterArquivos: (materiaId: number, anoId: number, forcarSync?: boolean) => Promise<StatusVinculoClassroom | null>
  preCarregarArquivos: (materiaId: number, anoId: number) => Promise<void>
  atualizarArquivoLocal: (materiaId: number, driveFileId: string, dados: Partial<ArquivoClassroom>) => void
  baixarItem: (materiaId: number, anoId: number, driveFileId: string, originalName: string) => Promise<void>
  salvarNomePersonalizado: (materiaId: number, anoId: number, driveFileId: string, originalName: string, novoNome: string) => Promise<void>
  salvarPastaDestino: (materiaId: number, anoId: number, driveFileId: string, originalName: string, novaPasta: string) => Promise<void>
  abrirItemLocal: (materiaId: number, id: number) => Promise<void>
  alternarOcultarArquivo: (materiaId: number, anoId: number, driveFileId: string, originalName: string, ocultar: boolean) => Promise<void>
  enviarArquivoLocal: (materiaId: number, anoId: number, folderCategory: string, file: File) => Promise<void>
}

const ContextoClassroom = createContext<ContextoClassroomData>({} as ContextoClassroomData)

export function ProvedorClassroom({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [filesCache, setFilesCache] = useState<Record<number, StatusVinculoClassroom>>({})
  const [classroomConfig, setClassroomConfig] = useState<ConfiguracaoClassroom | null>(null)
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({})
  const [syncingStates, setSyncingStates] = useState<Record<number, boolean>>({})

  const filesCacheRef = React.useRef(filesCache)

  React.useEffect(() => {
    filesCacheRef.current = filesCache
  }, [filesCache])

  const obterArquivos = useCallback(async (
    materiaId: number, 
    anoId: number, 
    forcarSync: boolean = false
  ): Promise<StatusVinculoClassroom | null> => {
    if (!session?.accessToken) return null

    const cacheAtual = filesCacheRef.current
    if (!forcarSync && cacheAtual[materiaId]) {
      return cacheAtual[materiaId]
    }

    const isExisting = !!cacheAtual[materiaId]

    if (isExisting) {
      setSyncingStates(prev => ({ ...prev, [materiaId]: true }))
    } else {
      setLoadingStates(prev => ({ ...prev, [materiaId]: true }))
    }

    try {
      const googleToken = session.googleAccessToken || null
      const connectionData = await classroom_service.obterArquivos(
        session.accessToken, 
        googleToken, 
        materiaId, 
        anoId
      )

      setFilesCache(prev => ({ ...prev, [materiaId]: connectionData }))

      if (!classroomConfig) {
        const configData = await classroom_service.obterConfiguracao(session.accessToken)
        setClassroomConfig(configData)
      }

      return connectionData
    } catch (error) {
      console.error(error)
      return null
    } finally {
      setLoadingStates(prev => ({ ...prev, [materiaId]: false }))
      setSyncingStates(prev => ({ ...prev, [materiaId]: false }))
    }
  }, [session, classroomConfig])

  const preCarregarArquivos = useCallback(async (materiaId: number, anoId: number): Promise<void> => {
    if (filesCache[materiaId] || loadingStates[materiaId]) return
    obterArquivos(materiaId, anoId, false)
  }, [filesCache, loadingStates, obterArquivos])

  const atualizarArquivoLocal = useCallback((
    materiaId: number, 
    driveFileId: string, 
    dados: Partial<ArquivoClassroom>
  ) => {
    setFilesCache(prev => {
      const existing = prev[materiaId]
      if (!existing) return prev

      return {
        ...prev,
        [materiaId]: {
          ...existing,
          arquivos: existing.arquivos.map(fileItem => 
            fileItem.drive_file_id === driveFileId 
              ? { ...fileItem, ...dados } 
              : fileItem
          )
        }
      }
    })
  }, [])

  const baixarItem = useCallback(async (
    materiaId: number, 
    anoId: number, 
    driveFileId: string, 
    originalName: string
  ) => {
    if (!session?.accessToken || !session.googleAccessToken) return

    try {
      const downloadedItem = await classroom_service.baixarArquivo(
        session.accessToken,
        session.googleAccessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName
      )

      atualizarArquivoLocal(materiaId, driveFileId, {
        id: downloadedItem.id,
        is_downloaded: downloadedItem.is_downloaded,
        local_path: downloadedItem.local_path
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, atualizarArquivoLocal])

  const salvarNomePersonalizado = useCallback(async (
    materiaId: number, 
    anoId: number, 
    driveFileId: string, 
    originalName: string, 
    novoNome: string
  ) => {
    if (!session?.accessToken) return

    try {
      const updatedItem = await classroom_service.atualizarArquivo(
        session.accessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName,
        { custom_name: novoNome.trim() || null }
      )

      atualizarArquivoLocal(materiaId, driveFileId, {
        id: updatedItem.id,
        custom_name: updatedItem.custom_name
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, atualizarArquivoLocal])

  const salvarPastaDestino = useCallback(async (
    materiaId: number, 
    anoId: number, 
    driveFileId: string, 
    originalName: string, 
    novaPasta: string
  ) => {
    if (!session?.accessToken) return

    try {
      const updatedItem = await classroom_service.atualizarArquivo(
        session.accessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName,
        { selected_folder: novaPasta }
      )

      atualizarArquivoLocal(materiaId, driveFileId, {
        id: updatedItem.id,
        selected_folder: updatedItem.selected_folder
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, atualizarArquivoLocal])

  const abrirItemLocal = useCallback(async (materiaId: number, id: number) => {
    if (!session?.accessToken) return
    try {
      await classroom_service.abrirArquivoLocal(session.accessToken, id)
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session])

  const alternarOcultarArquivo = useCallback(async (
    materiaId: number, 
    anoId: number, 
    driveFileId: string, 
    originalName: string, 
    ocultar: boolean
  ) => {
    if (!session?.accessToken) return
    try {
      const updatedItem = await classroom_service.atualizarArquivo(
        session.accessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName,
        { is_ignored: ocultar }
      )
      atualizarArquivoLocal(materiaId, driveFileId, {
        id: updatedItem.id,
        is_ignored: updatedItem.is_ignored
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, atualizarArquivoLocal])

  const enviarArquivoLocal = useCallback(async (
    materiaId: number, 
    anoId: number, 
    folderCategory: string, 
    file: File
  ) => {
    if (!session?.accessToken) return
    try {
      const uploadedItem = await classroom_service.adicionarArquivoLocal(
        session.accessToken,
        materiaId,
        anoId,
        folderCategory,
        file
      )
      
      setFilesCache(prev => {
        const existing = prev[materiaId]
        if (!existing) return prev
        return {
          ...prev,
          [materiaId]: {
            ...existing,
            arquivos: [uploadedItem, ...existing.arquivos]
          }
        }
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session])

  return (
    <ContextoClassroom.Provider value={{
      filesCache,
      classroomConfig,
      loadingStates,
      syncingStates,
      obterArquivos,
      preCarregarArquivos,
      atualizarArquivoLocal,
      baixarItem,
      salvarNomePersonalizado,
      salvarPastaDestino,
      abrirItemLocal,
      alternarOcultarArquivo,
      enviarArquivoLocal
    }}>
      {children}
    </ContextoClassroom.Provider>
  )
}

export function useClassroom() {
  return useContext(ContextoClassroom)
}

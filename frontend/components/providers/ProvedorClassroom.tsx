'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  classroom_service, 
  ConfiguracaoClassroom, 
  ArquivoClassroom, 
  StatusVinculoClassroom 
} from '@/lib/api/classroom'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'

interface ContextoClassroomData {
  filesCache: Record<number, StatusVinculoClassroom>
  classroomConfig: ConfiguracaoClassroom | null
  loadingStates: Record<number, boolean>
  syncingStates: Record<number, boolean>
  directoryHandle: FileSystemDirectoryHandle | null
  hasFolderPermission: boolean
  isFileSystemSupported: boolean
  solicitarAcessoPasta: () => Promise<void>
  desvincularPasta: () => Promise<void>
  escanearPastaLocal: (materiaId: number, anoId: number) => Promise<void>
  obterArquivos: (materiaId: number, anoId: number, forcarSync?: boolean) => Promise<StatusVinculoClassroom | null>
  preCarregarArquivos: (materiaId: number, anoId: number) => Promise<void>
  atualizarArquivoLocal: (materiaId: number, driveFileId: string, dados: Partial<ArquivoClassroom>) => void
  baixarItem: (materiaId: number, anoId: number, driveFileId: string, originalName: string, selectedFolder?: string) => Promise<void>
  salvarNomePersonalizado: (materiaId: number, anoId: number, driveFileId: string, originalName: string, novoNome: string) => Promise<void>
  salvarPastaDestino: (materiaId: number, anoId: number, driveFileId: string, originalName: string, novaPasta: string) => Promise<void>
  abrirItemLocal: (materiaId: number, identificador: number | string) => Promise<void>
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
  
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [hasFolderPermission, setHasFolderPermission] = useState<boolean>(false)
  const [isFileSystemSupported, setIsFileSystemSupported] = useState<boolean>(false)

  const filesCacheRef = React.useRef(filesCache)

  React.useEffect(() => {
    filesCacheRef.current = filesCache
  }, [filesCache])

  React.useEffect(() => {
    setIsFileSystemSupported(typeof window !== 'undefined' && 'showDirectoryPicker' in window)
    
    const restaurarHandle = async () => {
      if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
        try {
          const handle = await GerenciadorDiretorio.carregarHandle()
          if (handle) {
            setDirectoryHandle(handle)
            const temPermissao = await (handle as any).queryPermission({ mode: 'readwrite' }) === 'granted'
            setHasFolderPermission(temPermissao)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    restaurarHandle()
  }, [])

  const solicitarAcessoPasta = useCallback(async () => {
    try {
      const handle = await GerenciadorDiretorio.obterDiretorioHandle()
      setDirectoryHandle(handle)
      const temPermissao = await GerenciadorDiretorio.verificarPermissao(handle, true)
      setHasFolderPermission(temPermissao)
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [])

  const desvincularPasta = useCallback(async () => {
    try {
      await GerenciadorDiretorio.removerHandle()
      setDirectoryHandle(null)
      setHasFolderPermission(false)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const escanearPastaLocal = useCallback(async (materiaId: number, anoId: number) => {
    if (!session?.accessToken || !directoryHandle || !hasFolderPermission) return

    const cache = filesCacheRef.current[materiaId]
    if (!cache) return

    try {
      setSyncingStates(prev => ({ ...prev, [materiaId]: true }))
      const localFiles = await GerenciadorDiretorio.escanearDiretorioLocal(directoryHandle)
      
      const courseName = (cache.curso_nome || "Sem_Curso").toLowerCase()
      const year = cache.ano_letivo || String(anoId)
      const subjectName = (cache.materia_nome || "Materia").toLowerCase()

      const filesToSync = localFiles.filter(item => {
        const parts = item.local_path.toLowerCase().split('/')
        return parts.includes(courseName) && parts.includes(year) && parts.includes(subjectName)
      })

      const updatedFiles = await classroom_service.sincronizarArquivosLocais(
        session.accessToken,
        materiaId,
        anoId,
        filesToSync
      )

      const normalizedFiles = updatedFiles.map(fileItem => ({
        ...fileItem,
        selected_folder: fileItem.selected_folder === 'docs' ? 'documentos' : fileItem.selected_folder
      }))

      setFilesCache(prev => {
        const existing = prev[materiaId]
        if (!existing) return prev

        const mergedFiles = [...existing.arquivos]

        normalizedFiles.forEach(upd => {
          const idx = mergedFiles.findIndex(f => f.drive_file_id === upd.drive_file_id)
          if (idx !== -1) {
            mergedFiles[idx] = { ...mergedFiles[idx], ...upd }
          } else {
            mergedFiles.push(upd)
          }
        })

        const updatedIds = new Set(normalizedFiles.map(u => u.drive_file_id))
        const finalFiles = mergedFiles.map(f => {
          if (!f.drive_file_id.startsWith('local_')) {
            if (!updatedIds.has(f.drive_file_id)) {
              return { ...f, local_path: null }
            }
          }
          return f
        }).filter(f => {
          if (f.drive_file_id.startsWith('local_')) {
            return updatedIds.has(f.drive_file_id)
          }
          return true
        })

        return {
          ...prev,
          [materiaId]: {
            ...existing,
            arquivos: finalFiles
          }
        }
      })
    } catch (error) {
      console.error(error)
    } finally {
      setSyncingStates(prev => ({ ...prev, [materiaId]: false }))
    }
  }, [session, directoryHandle, hasFolderPermission])

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

      if (connectionData && connectionData.arquivos) {
        connectionData.arquivos = connectionData.arquivos.map(fileItem => ({
          ...fileItem,
          selected_folder: fileItem.selected_folder === 'docs' ? 'documentos' : fileItem.selected_folder
        }))
      }

      setFilesCache(prev => ({ ...prev, [materiaId]: connectionData }))

      if (!classroomConfig) {
        const configData = await classroom_service.obterConfiguracao(session.accessToken)
        setClassroomConfig(configData)
      }

      if (directoryHandle && hasFolderPermission) {
        setTimeout(() => {
          escanearPastaLocal(materiaId, anoId)
        }, 100)
      }

      return connectionData
    } catch (error) {
      console.error(error)
      return null
    } finally {
      setLoadingStates(prev => ({ ...prev, [materiaId]: false }))
      setSyncingStates(prev => ({ ...prev, [materiaId]: false }))
    }
  }, [session, classroomConfig, directoryHandle, hasFolderPermission, escanearPastaLocal])

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
    originalName: string,
    selectedFolder?: string
  ) => {
    if (!session?.accessToken || !session.googleAccessToken || !directoryHandle || !hasFolderPermission) return

    const cache = filesCacheRef.current[materiaId]
    if (!cache) return

    const courseName = cache.curso_nome || "Sem_Curso"
    const year = cache.ano_letivo || String(anoId)
    const subjectName = cache.materia_nome || "Materia"
    const fileItem = cache.arquivos.find(f => f.drive_file_id === driveFileId)
    const folder = selectedFolder || fileItem?.selected_folder || 'documentos'
    const finalFileName = fileItem?.custom_name || originalName

    try {
      const fileBlob = await classroom_service.obterConteudoArquivo(
        session.accessToken,
        session.googleAccessToken,
        driveFileId
      )

      const pathParts = ['UEM', 'Cursos', courseName, year, subjectName, folder]
      const localPath = await GerenciadorDiretorio.gravarArquivoLocal(directoryHandle, pathParts, finalFileName, fileBlob)

      const downloadedItem = await classroom_service.baixarArquivo(
        session.accessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName,
        localPath,
        folder
      )

      localStorage.setItem('baixado_' + driveFileId, 'true')

      atualizarArquivoLocal(materiaId, driveFileId, {
        id: downloadedItem.id,
        local_path: downloadedItem.local_path
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, directoryHandle, hasFolderPermission, atualizarArquivoLocal])

  const salvarNomePersonalizado = useCallback(async (
    materiaId: number, 
    anoId: number, 
    driveFileId: string, 
    originalName: string, 
    novoNome: string
  ) => {
    if (!session?.accessToken) return

    try {
      const cache = filesCacheRef.current[materiaId]
      const fileItem = cache?.arquivos.find(f => f.drive_file_id === driveFileId)
      let newLocalPath: string | null = null

      if (fileItem && directoryHandle && hasFolderPermission) {
        const isDownloaded = localStorage.getItem('baixado_' + driveFileId) === 'true'
        if (isDownloaded) {
          const courseName = cache.curso_nome || "Sem_Curso"
          const year = cache.ano_letivo || String(anoId)
          const subjectName = cache.materia_nome || "Materia"
          const folder = fileItem.selected_folder || "documentos"
          const pathParts = ['UEM', 'Cursos', courseName, year, subjectName, folder]
          const oldName = fileItem.custom_name || fileItem.original_name
          const newName = novoNome.trim() || fileItem.original_name

          if (oldName !== newName) {
            const success = await GerenciadorDiretorio.renomearArquivoLocal(directoryHandle, pathParts, oldName, newName)
            if (success) {
              newLocalPath = [...pathParts, newName].join('/')
            }
          }
        }
      }

      const updatedItem = await classroom_service.atualizarArquivo(
        session.accessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName,
        { 
          custom_name: novoNome.trim() || null,
          ...(newLocalPath ? { local_path: newLocalPath } : {})
        }
      )

      atualizarArquivoLocal(materiaId, driveFileId, {
        id: updatedItem.id,
        custom_name: updatedItem.custom_name,
        ...(newLocalPath ? { local_path: newLocalPath } : {})
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, directoryHandle, hasFolderPermission, atualizarArquivoLocal])

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
      
      if (directoryHandle && hasFolderPermission) {
        const cache = filesCacheRef.current[materiaId]
        const fileItem = cache?.arquivos.find(f => f.drive_file_id === driveFileId)
        const isDownloaded = localStorage.getItem('baixado_' + driveFileId) === 'true'
        if (fileItem && isDownloaded && fileItem.local_path) {
          try {
            const courseName = cache.curso_nome || "Sem_Curso"
            const year = cache.ano_letivo || String(anoId)
            const subjectName = cache.materia_nome || "Materia"
            
            const oldParts = fileItem.local_path.split('/')
            const oldFileName = fileItem.custom_name || fileItem.original_name
            const fileBlob = await GerenciadorDiretorio.lerArquivoLocal(directoryHandle, oldParts, oldFileName)
            
            const newParts = ['UEM', 'Cursos', courseName, year, subjectName, novaPasta]
            const newLocalPath = await GerenciadorDiretorio.gravarArquivoLocal(directoryHandle, newParts, oldFileName, fileBlob)
            
            const downloadedItem = await classroom_service.baixarArquivo(
              session.accessToken,
              driveFileId,
              materiaId,
              anoId,
              originalName,
              newLocalPath,
              novaPasta
            )
            
            atualizarArquivoLocal(materiaId, driveFileId, {
              local_path: downloadedItem.local_path
            })
          } catch (e) {
            console.error(e)
          }
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [session, directoryHandle, hasFolderPermission, atualizarArquivoLocal])

  const abrirItemLocal = useCallback(async (materiaId: number, identificador: number | string) => {
    const cache = filesCacheRef.current[materiaId]
    if (!cache || !directoryHandle || !hasFolderPermission) return

    const arq = cache.arquivos.find(f => f.id === identificador || f.drive_file_id === identificador)
    if (!arq || !arq.local_path) return

    try {
      const parts = arq.local_path.split('/')
      const fileName = parts.pop() || arq.original_name
      const fileBlob = await GerenciadorDiretorio.lerArquivoLocal(directoryHandle, parts, fileName)
      const fileUrl = URL.createObjectURL(fileBlob)
      window.open(fileUrl, '_blank')
    } catch (error) {
      console.error(error)
      throw error
    }
  }, [directoryHandle, hasFolderPermission])

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
    if (!session?.accessToken || !directoryHandle || !hasFolderPermission) return

    const cache = filesCacheRef.current[materiaId]
    if (!cache) return

    const courseName = cache.curso_nome || "Sem_Curso"
    const year = cache.ano_letivo || String(anoId)
    const subjectName = cache.materia_nome || "Materia"

    try {
      const pathParts = ['UEM', 'Cursos', courseName, year, subjectName, folderCategory]
      const localPath = await GerenciadorDiretorio.gravarArquivoLocal(directoryHandle, pathParts, file.name, file)

      const uploadedItem = await classroom_service.adicionarArquivoLocal(
        session.accessToken,
        materiaId,
        anoId,
        folderCategory,
        file.name,
        localPath
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
  }, [session, directoryHandle, hasFolderPermission])

  return (
    <ContextoClassroom.Provider value={{
      filesCache,
      classroomConfig,
      loadingStates,
      syncingStates,
      directoryHandle,
      hasFolderPermission,
      isFileSystemSupported,
      solicitarAcessoPasta,
      desvincularPasta,
      escanearPastaLocal,
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

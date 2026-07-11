'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Files, Upload, Brain } from 'lucide-react'
import { SidebarArquivosMateria } from '@/components/molecules/SidebarArquivosMateria'
import { SplitterVisualizacao } from '@/components/organisms/SplitterVisualizacao'
import { obterBlobGoogleDrive } from '@/lib/utils/googleDrive'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'
import { ModalAcessoPasta } from '@/components/molecules/ModalAcessoPasta'
import SidebarChatIA from '@/components/organisms/SidebarChatIA'
import { useSincronizarUrlVisualizador } from '@/lib/hooks/useSincronizarUrlVisualizador'
import { VideoClassroom } from '@/lib/api/classroom'

interface TemplateVisualizadorPDFProps {
  materiaId: number
  files: any[]
  videos: VideoClassroom[]
  initialLeftFileId: string | null
  initialRightFileId: string | null
}

export function TemplateVisualizadorPDF({
  materiaId,
  files,
  videos,
  initialLeftFileId,
  initialRightFileId
}: TemplateVisualizadorPDFProps) {
  const { data: session } = useSession()
  const {
    directoryHandle,
    hasFolderPermission,
    alternarOcultarArquivo,
    filesCache,
    loadingStates,
    solicitarAcessoPasta,
    isFileSystemSupported
  } = useClassroom()
  const { anoAtivoId } = useAcademico()
  const customFolders = filesCache[materiaId]?.custom_folders || ''
  const isCargandoSidebar = loadingStates[materiaId]

  const [leftFileId, setLeftFileId] = useState<string | null>(initialLeftFileId)
  const [rightFileId, setRightFileId] = useState<string | null>(initialRightFileId)
  const [showPermissionModal, definirExibicaoModal] = useState(false)
  const modalExibidoRef = useRef<Record<string, boolean>>({})

  useSincronizarUrlVisualizador(leftFileId, rightFileId)

  const todosArquivos = React.useMemo(() => {
    const arquivosMapeados = files.map(f => ({ ...f, video_tipo: undefined }))
    const videosMapeados = (videos || []).map(v => ({
      drive_file_id: v.video_id,
      original_name: v.titulo,
      custom_name: v.custom_name,
      selected_folder: v.selected_folder,
      is_ignored: v.is_ignored,
      local_path: null,
      sync_at: v.sync_at,
      video_tipo: v.tipo
    }))
    return [...arquivosMapeados, ...videosMapeados]
  }, [files, videos])

  const [orderedFiles, setOrderedFiles] = useState<any[]>([])

  const obterArquivosOrdenados = useCallback((baseFiles: any[]) => {
    if (typeof window === 'undefined') return baseFiles
    const storedOrder = localStorage.getItem(`minha_uem_visualizador_ordem_${materiaId}`)
    if (!storedOrder) {
      return [...baseFiles].sort((a, b) => {
        const nameA = (a.custom_name || a.original_name).toLowerCase()
        const nameB = (b.custom_name || b.original_name).toLowerCase()
        return nameA.localeCompare(nameB, 'pt-BR')
      })
    }
    try {
      const orderedIds: string[] = JSON.parse(storedOrder)
      return [...baseFiles].sort((a, b) => {
        const idxA = orderedIds.indexOf(a.drive_file_id)
        const idxB = orderedIds.indexOf(b.drive_file_id)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        const nameA = (a.custom_name || a.original_name).toLowerCase()
        const nameB = (b.custom_name || b.original_name).toLowerCase()
        return nameA.localeCompare(nameB, 'pt-BR')
      })
    } catch {
      return baseFiles
    }
  }, [materiaId])

  useEffect(() => {
    setOrderedFiles(obterArquivosOrdenados(todosArquivos))
  }, [todosArquivos, obterArquivosOrdenados])

  const lidarComReordenacaoManual = useCallback((draggedId: string, targetId: string) => {
    setOrderedFiles(prev => {
      const list = [...prev]
      const idxDragged = list.findIndex(f => f.drive_file_id === draggedId)
      const idxTarget = list.findIndex(f => f.drive_file_id === targetId)
      if (idxDragged === -1 || idxTarget === -1) return prev

      const [draggedItem] = list.splice(idxDragged, 1)
      list.splice(idxTarget, 0, draggedItem)

      const orderedIds = list.map(f => f.drive_file_id)
      localStorage.setItem(`minha_uem_visualizador_ordem_${materiaId}`, JSON.stringify(orderedIds))
      return list
    })
  }, [materiaId])

  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [sidebarFilesOpen, setSidebarFilesOpen] = useState(true)
  const [chatIAOpen, setChatIAOpen] = useState(false)

  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
  const dragCounterRef = useRef(0)
  const arquivosCarregandoRef = useRef<Record<string, boolean>>({})

  const carregarPdfDoDrive = useCallback(async (fileId: string) => {
    try {
      const fileItem = todosArquivos.find(f => f.drive_file_id === fileId)
      if (fileItem?.video_tipo === 'youtube') {
        setFileUrls(prev => ({ ...prev, [fileId]: 'youtube' }))
        return 'youtube'
      }

      if (fileItem && fileItem.local_path && directoryHandle && hasFolderPermission) {
        try {
          const parts = fileItem.local_path.split('/')
          const fileName = parts.pop() || fileItem.original_name
          const fileBlob = await GerenciadorDiretorio.lerArquivoLocal(directoryHandle, parts, fileName)
          const url = URL.createObjectURL(fileBlob)
          setFileUrls(prev => ({ ...prev, [fileId]: url }))
          return url
        } catch (e) {
          console.error(e)
        }
      }

      if (fileId.startsWith('local_')) {
        setFileUrls(prev => ({ ...prev, [fileId]: 'failed' }))
        return null
      }
      if (!session?.googleAccessToken) {
        setFileUrls(prev => ({ ...prev, [fileId]: 'failed' }))
        return null
      }
      const blob = await obterBlobGoogleDrive(fileId, session.googleAccessToken)
      const url = URL.createObjectURL(blob)
      setFileUrls(prev => ({ ...prev, [fileId]: url }))
      return url
    } catch (err) {
      console.error(err)
      setFileUrls(prev => ({ ...prev, [fileId]: 'failed' }))
      return null
    }
  }, [session?.googleAccessToken, todosArquivos, directoryHandle, hasFolderPermission])

  const lidarComAberturaArquivo = useCallback((fileId: string, side: 'left' | 'right') => {
    if (side === 'left') {
      if (leftFileId && !rightFileId && leftFileId !== fileId) {
        setRightFileId(leftFileId)
      }
      setLeftFileId(fileId)
    } else {
      if (rightFileId && !leftFileId && rightFileId !== fileId) {
        setLeftFileId(rightFileId)
      }
      setRightFileId(fileId)
    }
  }, [leftFileId, rightFileId])

  const lidarComDragEnterGlobal = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDraggingGlobal(true)
  }

  const lidarComDragLeaveGlobal = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDraggingGlobal(false)
  }

  const lidarComDropGlobal = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingGlobal(false)
  }

  const lidarComDropLocal = useCallback((file: File, side: 'left' | 'right') => {
    if (file.type !== 'application/pdf') return
    const url = URL.createObjectURL(file)
    const localId = `local_${Date.now()}`

    setFileUrls(prev => ({ ...prev, [localId]: url }))
    if (side === 'left') {
      if (leftFileId && !rightFileId) setRightFileId(leftFileId)
      setLeftFileId(localId)
    } else {
      if (rightFileId && !leftFileId) setLeftFileId(rightFileId)
      setRightFileId(localId)
    }
  }, [leftFileId, rightFileId])

  const fecharLadoEsquerdo = useCallback(() => {
    if (leftFileId && rightFileId) {
      setLeftFileId(rightFileId)
      setRightFileId(null)
    } else {
      setLeftFileId(null)
    }
  }, [leftFileId, rightFileId])

  const fecharLadoDireito = useCallback(() => {
    setRightFileId(null)
  }, [])

  const lidarComOcultarArquivo = useCallback(async (fileId: string, atualOcultado: boolean) => {
    const fileItem = todosArquivos.find(f => f.drive_file_id === fileId)
    if (!fileItem || !anoAtivoId) return
    try {
      await alternarOcultarArquivo(materiaId, anoAtivoId, fileId, fileItem.original_name, !atualOcultado)
    } catch (err) {
      console.error(err)
    }
  }, [todosArquivos, anoAtivoId, alternarOcultarArquivo, materiaId])

  const lidarComDropArquivo = useCallback((fileId: string, side: 'left' | 'right') => {
    lidarComAberturaArquivo(fileId, side)
  }, [lidarComAberturaArquivo])

  const lidarComUploadLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') return
      const url = URL.createObjectURL(file)
      const localId = `local_${Date.now()}`
      setFileUrls(prev => ({ ...prev, [localId]: url }))
      setLeftFileId(localId)
      setRightFileId(null)
    }
  }

  useEffect(() => {
    if (leftFileId && !fileUrls[leftFileId] && !arquivosCarregandoRef.current[leftFileId]) {
      const fileItem = todosArquivos.find(f => f.drive_file_id === leftFileId)
      const ehLocal = leftFileId.startsWith('local_') || !!fileItem?.local_path
      if (!ehLocal && !session?.googleAccessToken) {
        return
      }

      if (fileItem || !leftFileId.startsWith('local_')) {
        arquivosCarregandoRef.current[leftFileId] = true
        carregarPdfDoDrive(leftFileId).finally(() => {
          delete arquivosCarregandoRef.current[leftFileId]
        })
      }
    }
  }, [leftFileId, todosArquivos, fileUrls, carregarPdfDoDrive, session?.googleAccessToken])

  useEffect(() => {
    if (rightFileId && !fileUrls[rightFileId] && !arquivosCarregandoRef.current[rightFileId]) {
      const fileItem = todosArquivos.find(f => f.drive_file_id === rightFileId)
      const ehLocal = rightFileId.startsWith('local_') || !!fileItem?.local_path
      if (!ehLocal && !session?.googleAccessToken) {
        return
      }

      if (fileItem || !rightFileId.startsWith('local_')) {
        arquivosCarregandoRef.current[rightFileId] = true
        carregarPdfDoDrive(rightFileId).finally(() => {
          delete arquivosCarregandoRef.current[rightFileId]
        })
      }
    }
  }, [rightFileId, todosArquivos, fileUrls, carregarPdfDoDrive, session?.googleAccessToken])

  useEffect(() => {
    const temArquivoLocalSemPermissao = (fileId: string | null) => {
      if (!fileId) return false
      const fileItem = todosArquivos.find(f => f.drive_file_id === fileId)
      const ehLocal = fileId.startsWith('local_') || !!fileItem?.local_path
      return ehLocal && !hasFolderPermission
    }

    const leftSemPermissao = temArquivoLocalSemPermissao(leftFileId)
    const rightSemPermissao = temArquivoLocalSemPermissao(rightFileId)

    if (leftSemPermissao && leftFileId && !modalExibidoRef.current[leftFileId]) {
      modalExibidoRef.current[leftFileId] = true
      definirExibicaoModal(true)
    } else if (rightSemPermissao && rightFileId && !modalExibidoRef.current[rightFileId]) {
      modalExibidoRef.current[rightFileId] = true
      definirExibicaoModal(true)
    } else if (!leftSemPermissao && !rightSemPermissao) {
      definirExibicaoModal(false)
    }
  }, [leftFileId, rightFileId, todosArquivos, hasFolderPermission])

  const arquivosExibidos = (isFileSystemSupported && !!directoryHandle && hasFolderPermission)
    ? orderedFiles
    : orderedFiles.filter(f => !f.drive_file_id.startsWith('local_'))

  return (
    <div
      onDragEnter={lidarComDragEnterGlobal}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={lidarComDragLeaveGlobal}
      onDrop={lidarComDropGlobal}
      className="fixed inset-0 w-screen h-screen z-50 bg-background flex flex-col overflow-hidden select-none"
    >
      <header className="h-14 px-6 border-b border-border bg-card/70 backdrop-blur-md flex items-center justify-between shrink-0">
        <Link
          href={`/disciplinas/${materiaId}/arquivos`}
          className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para arquivos</span>
        </Link>

        <h1 className="text-sm font-black text-foreground uppercase tracking-wider hidden md:block">
          Visualizador de Arquivos
        </h1>

        <div className="flex items-center gap-2">
          {(isFileSystemSupported && !!directoryHandle && hasFolderPermission) && (
            <label className="flex items-center justify-center gap-1.5 h-9 px-3 border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl cursor-pointer transition-colors shadow-sm active:scale-95">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Local</span>
              <input type="file" accept=".pdf" className="hidden" onChange={lidarComUploadLocal} />
            </label>
          )}

          <button
            onClick={() => setSidebarFilesOpen(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 h-9 px-3 border rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              sidebarFilesOpen
                ? 'bg-primary/10 border-primary/25 text-primary'
                : 'bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Files className="w-3.5 h-3.5" />
            <span>Arquivos</span>
          </button>

          <button
            onClick={() => setChatIAOpen(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 h-9 px-3 border rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              chatIAOpen
                ? 'bg-primary/10 border-primary/25 text-primary font-black'
                : 'bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Assistente IA</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <SidebarArquivosMateria
          isOpen={sidebarFilesOpen}
          files={arquivosExibidos}
          onOpenFile={(fileId, side) => {
            if (side) {
              lidarComAberturaArquivo(fileId, side)
            } else {
              if (leftFileId && !rightFileId && leftFileId !== fileId) {
                lidarComAberturaArquivo(fileId, 'right')
              } else if (!leftFileId && rightFileId && rightFileId !== fileId) {
                lidarComAberturaArquivo(fileId, 'left')
              } else {
                lidarComAberturaArquivo(fileId, 'left')
                setRightFileId(null)
              }
            }
          }}
          leftFileId={leftFileId}
          rightFileId={rightFileId}
          onClose={() => setSidebarFilesOpen(false)}
          onToggleOcultar={lidarComOcultarArquivo}
          onReorder={lidarComReordenacaoManual}
          customFolders={customFolders}
          loading={isCargandoSidebar}
        />

        <SplitterVisualizacao
          leftFile={leftFileId ? todosArquivos.find(f => f.drive_file_id === leftFileId) || { drive_file_id: leftFileId, original_name: 'Arquivo Local', custom_name: null, selected_folder: 'documentos' } : null}
          rightFile={rightFileId ? todosArquivos.find(f => f.drive_file_id === rightFileId) || { drive_file_id: rightFileId, original_name: 'Arquivo Local', custom_name: null, selected_folder: 'documentos' } : null}
          leftFileUrl={leftFileId ? fileUrls[leftFileId] || null : null}
          rightFileUrl={rightFileId ? fileUrls[rightFileId] || null : null}
          isSplit={rightFileId !== null}
          onCloseLeft={fecharLadoEsquerdo}
          onCloseRight={fecharLadoDireito}
          onDropFile={lidarComDropArquivo}
          onDropLocalFile={lidarComDropLocal}
          isDraggingGlobal={isDraggingGlobal}
          onCancelDrag={() => setIsDraggingGlobal(false)}
          isLeftLoading={leftFileId !== null && !fileUrls[leftFileId]}
          isRightLoading={rightFileId !== null && !fileUrls[rightFileId]}
        />

        <SidebarChatIA isOpen={chatIAOpen} onClose={() => setChatIAOpen(false)} layoutMode="integrated" fileUrls={fileUrls} />
      </div>

      <ModalAcessoPasta
        isOpen={showPermissionModal}
        onClose={() => definirExibicaoModal(false)}
        onGrantAccess={solicitarAcessoPasta}
      />
    </div>
  )
}

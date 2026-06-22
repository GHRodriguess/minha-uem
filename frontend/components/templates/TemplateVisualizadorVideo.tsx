'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { VideoClassroom, ArquivoClassroom } from '@/lib/api/classroom'
import { obterBlobGoogleDrive } from '@/lib/utils/googleDrive'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'
import { VisualizadorVideoHeader } from '../molecules/VisualizadorVideoHeader'
import { VisualizadorVideoSidebar } from '../molecules/VisualizadorVideoSidebar'
import { VisualizadorVideoConteudo } from '../organisms/VisualizadorVideoConteudo'

interface TemplateVisualizadorVideoProps {
  materiaId: number
  videos: VideoClassroom[]
  arquivos: ArquivoClassroom[]
  initialVideoId: string | null
  initialPdfId: string | null
}

export function TemplateVisualizadorVideo({
  materiaId,
  videos,
  arquivos,
  initialVideoId,
  initialPdfId
}: TemplateVisualizadorVideoProps) {
  const { data: session } = useSession()
  const { directoryHandle, hasFolderPermission } = useClassroom()
  const [activeVideoId, setActiveVideoId] = useState<string | null>(initialVideoId || (videos[0]?.video_id || null))
  const [activePdfId, setActivePdfId] = useState<string | null>(initialPdfId)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [videoLocalUrl, setVideoLocalUrl] = useState<string | null>(null)
  const [chatIAOpen, setChatIAOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeVideo = (() => {
    const found = videos.find(v => v.video_id === activeVideoId)
    if (found) return found
    if (activeVideoId) {
      const arq = arquivos.find(a => a.drive_file_id === activeVideoId)
      if (arq) {
        return {
          video_id: arq.drive_file_id,
          titulo: arq.custom_name || arq.original_name,
          tipo: 'drive' as const,
          url: `https://drive.google.com/file/d/${arq.drive_file_id}/view`,
          custom_name: arq.custom_name || arq.original_name,
          classroom_id: '',
          materia: materiaId,
          sincronizado_em: ''
        }
      }
    }
    return undefined
  })()
  const activePdf = arquivos.find(a => a.drive_file_id === activePdfId)

  const carregarPdf = useCallback(async (fileId: string) => {
    if (!session?.googleAccessToken) return
    try {
      const blob = await obterBlobGoogleDrive(fileId, session.googleAccessToken)
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (e) {
      console.error(e)
    }
  }, [session?.googleAccessToken])

  useEffect(() => {
    if (activePdfId) {
      carregarPdf(activePdfId)
    } else {
      setPdfUrl(null)
    }
  }, [activePdfId, carregarPdf])

  const carregarVideoLocal = useCallback(async (localPath: string, fileName: string) => {
    if (!directoryHandle || !hasFolderPermission) return
    try {
      const parts = localPath.split('/')
      const file = parts.pop() || fileName
      const fileBlob = await GerenciadorDiretorio.lerArquivoLocal(directoryHandle, parts, file)
      const url = URL.createObjectURL(fileBlob)
      setVideoLocalUrl(url)
    } catch (e) {
      console.error(e)
      setVideoLocalUrl(null)
    }
  }, [directoryHandle, hasFolderPermission])

  useEffect(() => {
    if (activeVideo && activeVideo.tipo === 'drive' && arquivos.length > 0) {
      if (activeVideo.video_id.startsWith('local_')) {
        const arqCorresp = arquivos.find(a => a.drive_file_id === activeVideo.video_id)
        if (arqCorresp && arqCorresp.local_path) {
          carregarVideoLocal(arqCorresp.local_path, activeVideo.titulo)
          return
        }
      }
    }
    setVideoLocalUrl(null)
  }, [activeVideoId, activeVideo, arquivos, carregarVideoLocal])

  const obterVideoEmbedUrl = () => {
    if (!activeVideo) return ''
    if (activeVideo.tipo === 'youtube') {
      return `https://www.youtube.com/embed/${activeVideo.video_id}?autoplay=1`
    }
    return `https://drive.google.com/file/d/${activeVideo.video_id}/preview`
  }

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 bg-background flex flex-col overflow-hidden select-none">
      <VisualizadorVideoHeader
        materiaId={materiaId}
        titulo={activeVideo ? (activeVideo.custom_name || activeVideo.titulo) : 'Visualizador de Vídeo'}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chatIAOpen={chatIAOpen}
        setChatIAOpen={setChatIAOpen}
        fecharPdf={() => setActivePdfId(null)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <VisualizadorVideoSidebar
            videos={videos}
            arquivos={arquivos}
            activeVideoId={activeVideoId}
            activePdfId={activePdfId}
            selecionarVideo={setActiveVideoId}
            selecionarPdf={(id) => { setActivePdfId(id); setChatIAOpen(false) }}
          />
        )}

        <VisualizadorVideoConteudo
          videoEmbedUrl={obterVideoEmbedUrl()}
          videoLocalUrl={videoLocalUrl}
          pdfUrl={pdfUrl}
          pdfTitulo={activePdf ? (activePdf.custom_name || activePdf.original_name) : ''}
          activePdfId={activePdfId}
          chatIAOpen={chatIAOpen}
          fecharPdf={() => setActivePdfId(null)}
          fecharChatIA={() => setChatIAOpen(false)}
        />
      </div>
    </div>
  )
}

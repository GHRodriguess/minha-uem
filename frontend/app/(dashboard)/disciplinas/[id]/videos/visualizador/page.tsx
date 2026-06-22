'use client'

import React, { use, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { TemplateVisualizadorVideo } from '@/components/templates/TemplateVisualizadorVideo'

interface PaginaVisualizadorVideoProps {
  params: Promise<{ id: string }>
}

export default function PaginaVisualizadorVideo({
  params
}: PaginaVisualizadorVideoProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const videoId = searchParams.get('videoId')
  const pdfId = searchParams.get('pdfId')

  const materiaId = parseInt(id, 10)
  const { videosCache, obterVideos, filesCache, obterArquivos } = useClassroom()
  const { anoAtivoId } = useAcademico()

  useEffect(() => {
    if (materiaId && anoAtivoId) {
      if (!videosCache[materiaId]) obterVideos(materiaId, anoAtivoId)
      if (!filesCache[materiaId]) obterArquivos(materiaId, anoAtivoId)
    }
  }, [materiaId, anoAtivoId, videosCache, filesCache, obterVideos, obterArquivos])

  const videos = videosCache[materiaId]?.videos || []
  const arquivos = filesCache[materiaId]?.arquivos || []

  return (
    <TemplateVisualizadorVideo
      materiaId={materiaId}
      videos={videos}
      arquivos={arquivos}
      initialVideoId={videoId}
      initialPdfId={pdfId}
    />
  )
}

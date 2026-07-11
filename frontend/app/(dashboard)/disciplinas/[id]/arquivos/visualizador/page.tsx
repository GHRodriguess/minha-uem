'use client'

import React, { use, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { TemplateVisualizadorPDF } from '@/components/templates/TemplateVisualizadorPDF'

interface PaginaVisualizadorPDFProps {
  params: Promise<{ id: string }>
}

export default function PaginaVisualizadorPDF({
  params
}: PaginaVisualizadorPDFProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const fileId = searchParams.get('fileId')
  const rightFileId = searchParams.get('rightFileId')

  const materiaId = parseInt(id, 10)
  const { filesCache, obterArquivos, videosCache, obterVideos } = useClassroom()
  const { anoAtivoId } = useAcademico()

  useEffect(() => {
    if (materiaId && anoAtivoId) {
      if (!filesCache[materiaId]) obterArquivos(materiaId, anoAtivoId)
      if (!videosCache[materiaId]) obterVideos(materiaId, anoAtivoId)
    }
  }, [materiaId, anoAtivoId, filesCache, videosCache, obterArquivos, obterVideos])

  const dadosVinculo = filesCache[materiaId]
  const arquivosMateria = dadosVinculo?.arquivos || []
  const videosMateria = videosCache[materiaId]?.videos || []

  return (
    <TemplateVisualizadorPDF
      materiaId={materiaId}
      files={arquivosMateria}
      videos={videosMateria}
      initialLeftFileId={fileId}
      initialRightFileId={rightFileId}
    />
  )
}

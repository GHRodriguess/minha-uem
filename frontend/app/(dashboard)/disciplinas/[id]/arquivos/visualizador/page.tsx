'use client'

import React, { use, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { TemplateVisualizadorPDF } from '@/components/templates/TemplateVisualizadorPDF'
import { Loader2 } from 'lucide-react'

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
  const { filesCache, obterArquivos, loadingStates } = useClassroom()
  const { anoAtivoId } = useAcademico()

  useEffect(() => {
    if (materiaId && anoAtivoId && !filesCache[materiaId]) {
      obterArquivos(materiaId, anoAtivoId)
    }
  }, [materiaId, anoAtivoId, filesCache, obterArquivos])

  const dadosVinculo = filesCache[materiaId]
  const arquivosMateria = dadosVinculo?.arquivos || []
  const carregandoDados = loadingStates[materiaId] || (!dadosVinculo && !arquivosMateria.length)

  if (carregandoDados) {
    return (
      <div className="fixed inset-0 w-screen h-screen z-50 bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Sincronizando arquivos da matéria...
        </span>
      </div>
    )
  }

  return (
    <TemplateVisualizadorPDF
      materiaId={materiaId}
      files={arquivosMateria}
      initialLeftFileId={fileId}
      initialRightFileId={rightFileId}
    />
  )
}

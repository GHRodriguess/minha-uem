'use client'

import { use } from 'react'
import { TemplateArquivos } from '@/components/templates/TemplateArquivos'

interface PaginaArquivosProps {
  params: Promise<{ id: string }>
}

export default function PaginaArquivos({ params }: PaginaArquivosProps) {
  const { id } = use(params)
  return <TemplateArquivos materiaId={parseInt(id)} />
}

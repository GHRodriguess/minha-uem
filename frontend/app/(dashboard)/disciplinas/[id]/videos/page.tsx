'use client'

import React, { use } from 'react'
import { TemplateVideos } from '@/components/templates/TemplateVideos'

interface PaginaVideosProps {
  params: Promise<{ id: string }>
}

export default function PaginaVideos({ params }: PaginaVideosProps) {
  const { id } = use(params)
  return <TemplateVideos materiaId={parseInt(id, 10)} />
}

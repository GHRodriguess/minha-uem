'use client'

import React from 'react'
import { CheckCircle2, Cloud } from 'lucide-react'

interface StatusArquivoProps {
  isFileSystemSupported: boolean
  isReallyDownloaded: boolean
}

export function StatusArquivo({ isFileSystemSupported, isReallyDownloaded }: StatusArquivoProps) {
  if (!isFileSystemSupported) return null

  if (isReallyDownloaded) {
    return (
      <span className="text-emerald-500" title="Baixado localmente">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </span>
    )
  }

  return (
    <span className="text-muted-foreground/60" title="Disponível apenas no Google Drive">
      <Cloud className="w-3.5 h-3.5" />
    </span>
  )
}

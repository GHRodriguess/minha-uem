'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, FileWarning } from 'lucide-react'

interface VisualizadorTextoProps {
  fileUrl: string | null
}

export function VisualizadorTexto({ fileUrl }: VisualizadorTextoProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    if (!fileUrl) return

    setLoading(true)
    setError(false)

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) throw new Error()
        return response.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [fileUrl])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 bg-muted/20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider animate-pulse">
          Lendo arquivo...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2 p-6 text-center bg-muted/20">
        <FileWarning className="w-8 h-8 text-destructive" />
        <p className="text-xs font-bold text-foreground uppercase">Falha ao ler arquivo</p>
        <p className="text-[10px] text-muted-foreground">
          O formato do arquivo pode não ser compatível com a leitura de texto.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-card overflow-auto p-6 scrollbar-thin select-text">
      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
        {content}
      </pre>
    </div>
  )
}

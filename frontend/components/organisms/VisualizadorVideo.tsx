'use client'

import React from 'react'

interface VisualizadorVideoProps {
  embedUrl: string | null
  localUrl: string | null
}

export function VisualizadorVideo({ embedUrl, localUrl }: VisualizadorVideoProps) {
  if (localUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <video
          src={localUrl}
          controls
          autoPlay
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  if (embedUrl) {
    return (
      <div className="w-full h-full bg-black relative">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center p-6 bg-muted/20">
      <p className="text-xs font-bold text-muted-foreground uppercase">Vídeo indisponível</p>
    </div>
  )
}

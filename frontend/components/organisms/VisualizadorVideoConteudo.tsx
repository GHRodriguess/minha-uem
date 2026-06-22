'use client'

import React from 'react'
import { X } from 'lucide-react'
import SidebarChatIA from '@/components/organisms/SidebarChatIA'

interface VisualizadorVideoConteudoProps {
  videoEmbedUrl: string
  videoLocalUrl: string | null
  pdfUrl: string | null
  pdfTitulo: string
  activePdfId: string | null
  chatIAOpen: boolean
  fecharPdf: () => void
  fecharChatIA: () => void
}

export function VisualizadorVideoConteudo({
  videoEmbedUrl,
  videoLocalUrl,
  pdfUrl,
  pdfTitulo,
  activePdfId,
  chatIAOpen,
  fecharPdf,
  fecharChatIA
}: VisualizadorVideoConteudoProps) {
  const showRightPanel = activePdfId || chatIAOpen

  return (
    <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden bg-muted/10">
      <div className="flex-1 h-full rounded-2xl bg-card border border-border overflow-hidden flex flex-col shadow-sm relative">
        {videoLocalUrl ? (
          <video key={videoLocalUrl} src={videoLocalUrl} controls className="w-full h-full bg-black" autoPlay />
        ) : videoEmbedUrl ? (
          <iframe src={videoEmbedUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
            Nenhum vídeo selecionado
          </div>
        )}
      </div>

      {showRightPanel && (
        <>
          {activePdfId && pdfUrl ? (
            <div className="w-full lg:w-[480px] h-full rounded-2xl bg-card border border-border overflow-hidden flex flex-col shadow-sm relative shrink-0">
              <div className="h-10 px-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/10">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider truncate max-w-[200px]">
                  {pdfTitulo}
                </span>
                <button onClick={fecharPdf} className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <iframe src={pdfUrl} className="flex-1 w-full border-none" />
            </div>
          ) : chatIAOpen ? (
            <SidebarChatIA
              isOpen={true}
              onClose={fecharChatIA}
              layoutMode="integrated"
              className="rounded-2xl border border-border shadow-sm overflow-hidden"
              fileUrls={{}}
            />
          ) : null}
        </>
      )}
    </main>
  )
}

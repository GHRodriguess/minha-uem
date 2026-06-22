'use client'

import React, { useState } from 'react'
import { Video, FileText } from 'lucide-react'
import { VideoClassroom, ArquivoClassroom } from '@/lib/api/classroom'

interface VisualizadorVideoSidebarProps {
  videos: VideoClassroom[]
  arquivos: ArquivoClassroom[]
  activeVideoId: string | null
  activePdfId: string | null
  selecionarVideo: (id: string) => void
  selecionarPdf: (id: string) => void
}

export function VisualizadorVideoSidebar({
  videos,
  arquivos,
  activeVideoId,
  activePdfId,
  selecionarVideo,
  selecionarPdf
}: VisualizadorVideoSidebarProps) {
  const [activeTab, setActiveTab] = useState<'videos' | 'arquivos'>('videos')

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      <div className="flex border-b border-border text-[10px] font-black uppercase tracking-wider shrink-0 bg-muted/20">
        <button onClick={() => setActiveTab('videos')} className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'videos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Videos</button>
        <button onClick={() => setActiveTab('arquivos')} className={`flex-1 py-3 text-center transition-colors border-b-2 ${activeTab === 'arquivos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Arquivos</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-none">
        {activeTab === 'videos' ? (
          videos.filter(v => !v.is_ignored).map(v => (
            <button key={v.video_id} onClick={() => selecionarVideo(v.video_id)} className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-2.5 ${v.video_id === activeVideoId ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
              <Video className="w-4 h-4 shrink-0" />
              <span className="text-[11px] truncate leading-tight">{v.custom_name || v.titulo}</span>
            </button>
          ))
        ) : (
          arquivos.filter(a => !a.is_ignored && a.original_name.toLowerCase().endsWith('.pdf')).map(a => (
            <button key={a.drive_file_id} onClick={() => selecionarPdf(a.drive_file_id)} className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-2.5 ${a.drive_file_id === activePdfId ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-[11px] truncate leading-tight">{a.custom_name || a.original_name}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}

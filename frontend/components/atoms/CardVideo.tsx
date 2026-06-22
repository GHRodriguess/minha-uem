'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Edit2, Eye, EyeOff, Check, X, Play } from 'lucide-react'
import { VideoClassroom } from '@/lib/api/classroom'
import { useClassroom } from '@/components/providers/ProvedorClassroom'

interface CardVideoProps {
  materiaId: number
  video: VideoClassroom
}

export function CardVideo({ materiaId, video }: CardVideoProps) {
  const router = useRouter()
  const { atualizarVideo } = useClassroom()
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(video.custom_name || video.titulo)

  const lidarComEdicao = async () => {
    if (!nameInput.trim()) return
    await atualizarVideo(materiaId, video.video_id, { custom_name: nameInput.trim() })
    setEditing(false)
  }

  const lidarComOcultar = async () => {
    await atualizarVideo(materiaId, video.video_id, { is_ignored: !video.is_ignored })
  }

  const obterThumbnail = () => {
    if (video.tipo === 'youtube') {
      return `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
    }
    return video.thumbnail || ''
  }

  const thumbUrl = obterThumbnail()

  return (
    <div className={`bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative transition-all hover:border-primary/30 group ${video.is_ignored ? 'opacity-50 bg-muted/10' : ''}`}>
      <div className="relative aspect-video bg-background border border-border rounded-2xl overflow-hidden shrink-0 group-hover:scale-[1.02] transition-transform select-none">
        {thumbUrl ? (
          <img src={thumbUrl} alt={video.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
            <Video className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={() => router.push(`/disciplinas/${materiaId}/videos/visualizador?videoId=${video.video_id}`)}>
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
        <span className="absolute top-3 left-3 bg-card/85 backdrop-blur border border-border rounded-lg p-1.5 shadow-sm flex items-center justify-center">
          {video.tipo === 'youtube' ? (
            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.516 3.5 12 3.5 12 3.5s-7.517 0-9.387.555A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.87.556 9.388.556 9.388.556s7.516 0 9.387-.556a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          ) : (
            <Video className="w-3.5 h-3.5 text-primary" />
          )}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-1.5 w-full">
              <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} className="h-8 px-2 border border-border rounded-lg bg-background text-xs font-bold w-full focus:outline-none text-foreground" autoFocus />
              <button onClick={lidarComEdicao} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:opacity-90 transition-opacity">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setEditing(false); setNameInput(video.custom_name || video.titulo) }} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 justify-between">
              <p className="font-bold text-foreground text-xs leading-relaxed wrap-break-words whitespace-normal break-all">
                {video.custom_name || video.titulo}
              </p>
              <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted shrink-0 mt-0.5">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {video.custom_name && (
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider wrap-break-words whitespace-normal mt-0.5">
              Original: {video.titulo}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">
            {video.tipo === 'youtube' ? 'YouTube' : 'Google Drive'}
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={lidarComOcultar} className="p-1.5 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={video.is_ignored ? 'Mostrar Vídeo' : 'Ocultar Vídeo'}>
              {video.is_ignored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

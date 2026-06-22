'use client'

import React, { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { VideoClassroom } from '@/lib/api/classroom'
import { CardVideo } from '@/components/atoms/CardVideo'
import Esqueleto from '@/components/atoms/Esqueleto'

interface GaleriaVideosProps {
  materiaId: number
  videos: VideoClassroom[]
  carregando: boolean
}

export function GaleriaVideos({ materiaId, videos, carregando }: GaleriaVideosProps) {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'drive' | 'youtube'>('todos')
  const [showIgnored, setShowIgnored] = useState(false)

  const videosFiltrados = useMemo(() => {
    return videos.filter(video => {
      const matchSearch = (video.custom_name || video.titulo).toLowerCase().includes(searchText.toLowerCase())
      const matchType = filterType === 'todos' || video.tipo === filterType
      const matchIgnored = showIgnored ? true : !video.is_ignored
      return matchSearch && matchType && matchIgnored
    })
  }, [videos, searchText, filterType, showIgnored])

  if (carregando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-3xl p-5 space-y-4">
            <Esqueleto className="h-44 w-full rounded-2xl" />
            <Esqueleto className="h-5 w-2/3" />
            <Esqueleto className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar vídeo aula..." value={searchText} onChange={e => setSearchText(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-border rounded-xl bg-background text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto select-none">
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="h-10 px-3 border border-border rounded-xl bg-background text-xs font-bold text-muted-foreground focus:outline-none cursor-pointer">
            <option value="todos">Todos os Vídeos</option>
            <option value="youtube">YouTube</option>
            <option value="drive">Google Drive</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer shrink-0">
            <input type="checkbox" checked={showIgnored} onChange={e => setShowIgnored(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/25" />
            <span>Mostrar ocultos</span>
          </label>
        </div>
      </div>

      {videosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl p-6">
          <p className="text-xs text-muted-foreground font-medium">Nenhuma vídeo aula encontrada para os filtros ativos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videosFiltrados.map(video => (
            <CardVideo key={video.video_id} materiaId={materiaId} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { Noticia } from '@/lib/api/suporte'
import { Calendar, User, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CardNoticiaProps {
  noticia: Noticia
  isAdmin: boolean
  onEdit: (noticia: Noticia) => void
  onDelete: (id: number) => void
}

export default function CardNoticia({ noticia, isAdmin, onEdit, onDelete }: CardNoticiaProps) {
  const obterEstiloCategoria = (cat: string) => {
    switch (cat) {
      case 'GERAL':
        return 'bg-primary/10 text-primary'
      case 'ACADEMICO':
        return 'bg-emerald-500/10 text-emerald-500'
      case 'CLASSROOM':
        return 'bg-purple-500/10 text-purple-500'
      case 'MANUTENCAO':
        return 'bg-amber-500/10 text-amber-500'
      case 'NOVIDADES':
        return 'bg-sky-500/10 text-sky-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatarData = (dataStr: string) => {
    return new Date(dataStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-3 transition-all duration-200 hover:border-primary/20 shadow-sm relative">
      <div className="flex justify-between items-start gap-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${obterEstiloCategoria(noticia.category)}`}>
          {noticia.category}
        </span>
        {isAdmin && (
          <div className="flex gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(noticia)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(noticia.id)}
              className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-extrabold text-base text-foreground leading-tight">{noticia.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatarData(noticia.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{noticia.author_first_name || noticia.author_username}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{noticia.content}</p>
    </div>
  )
}

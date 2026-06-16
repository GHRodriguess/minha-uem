'use client'

import { Avaliacao, Materia } from '@/types/academico'
import { Calendar, Weight, FileEdit, Trash2 } from 'lucide-react'

interface CardTarefaKanbanProps {
  avaliacao: Avaliacao
  materia: Materia
  onEdit: (a: Avaliacao, materiaId: number) => void
  onDelete: (id: number) => void
}

export default function CardTarefaKanban({
  avaliacao,
  materia,
  onEdit,
  onDelete
}: CardTarefaKanbanProps) {
  const obterBadgeTipo = (tipo: string) => {
    const cores: Record<string, string> = {
      PROVA: 'bg-red-500/10 text-red-500 border-red-500/20',
      TRABALHO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      EXAME: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      TAREFA: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      PESQUISA: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      OUTRO: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
    return cores[tipo] || cores.OUTRO
  }

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'Sem data'
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano.slice(-2)}`
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-3 relative">
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md truncate max-w-37.5 uppercase">
          {materia.nome}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(avaliacao, materia.id)}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileEdit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(avaliacao.id)}
            className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
        {avaliacao.nome}
      </h4>

      <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold text-muted-foreground mt-1">
        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${obterBadgeTipo(avaliacao.tipo)}`}>
          {avaliacao.tipo}
        </span>

        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted-foreground/60" />
          {formatarData(avaliacao.data)}
        </span>

        <span className="flex items-center gap-1">
          <Weight className="w-3 h-3 text-muted-foreground/60" />
          P: {avaliacao.peso}
        </span>
      </div>

      {avaliacao.nota !== null && (
        <div className="mt-1 pt-2 border-t border-border/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Nota</span>
          <span className="text-xs font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            {Number(avaliacao.nota).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}

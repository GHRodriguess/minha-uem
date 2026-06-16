'use client'

import { Avaliacao, Materia } from '@/types/academico'
import { Calendar, FileEdit, Trash2, Weight } from 'lucide-react'

interface VisualizacaoListaProps {
  avaliacoes: (Avaliacao & { materia: Materia })[]
  onEdit: (a: Avaliacao, materiaId: number) => void
  onDelete: (id: number) => void
}

export default function VisualizacaoLista({
  avaliacoes,
  onEdit,
  onDelete
}: VisualizacaoListaProps) {
  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'Sem data'
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const obterStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      A_FAZER: 'A Fazer',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDO: 'Concluído'
    }
    return labels[status] || status
  }

  const obterStatusCor = (status: string) => {
    const cores: Record<string, string> = {
      A_FAZER: 'bg-red-500/10 text-red-500 border-red-500/20',
      EM_ANDAMENTO: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      CONCLUIDO: 'bg-green-500/10 text-green-500 border-green-500/20'
    }
    return cores[status] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }

  const tarefasOrdenadas = [...avaliacoes].sort((a, b) => {
    if (!a.data) return 1
    if (!b.data) return -1
    return a.data.localeCompare(b.data)
  })

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Tarefa</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Disciplina</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Prazo</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Peso / Nota</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="p-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {tarefasOrdenadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground font-medium">
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : (
              tarefasOrdenadas.map((item) => (
                <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <p className="text-xs font-bold text-foreground">{item.nome}</p>
                    <span className="text-[9px] font-black text-muted-foreground uppercase">{item.tipo}</span>
                  </td>
                  <td className="p-4 text-xs font-bold text-primary uppercase">{item.materia.nome}</td>
                  <td className="p-4 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                      {formatarData(item.data)}
                    </span>
                  </td>
                  <td className="p-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium flex items-center gap-0.5">
                        <Weight className="w-3 h-3 text-muted-foreground/60" />
                        P:{item.peso}
                      </span>
                      {item.nota !== null && (
                        <span className="font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full text-[10px]">
                          Nota: {item.nota}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase ${obterStatusCor(item.status)}`}>
                      {obterStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item, item.materia.id)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

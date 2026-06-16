'use client'

import { Avaliacao, Materia } from '@/types/academico'
import CardTarefaKanban from '../molecules/CardTarefaKanban'
import { Plus } from 'lucide-react'

interface VisualizacaoKanbanProps {
  avaliacoes: (Avaliacao & { materia: Materia })[]
  onEdit: (a: Avaliacao, materiaId: number) => void
  onDelete: (id: number) => void
  onStatusChange: (id: number, novoStatus: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO') => void
  onAdd: (status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO') => void
}

export default function VisualizacaoKanban({
  avaliacoes,
  onEdit,
  onDelete,
  onStatusChange,
  onAdd
}: VisualizacaoKanbanProps) {
  const colunas = [
    { id: 'A_FAZER' as const, titulo: 'A Fazer', cor: 'border-t-red-500' },
    { id: 'EM_ANDAMENTO' as const, titulo: 'Em Andamento', cor: 'border-t-amber-500' },
    { id: 'CONCLUIDO' as const, titulo: 'Concluído', cor: 'border-t-green-500' }
  ]

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString())
  }

  const handleDrop = (e: React.DragEvent, status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO') => {
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (!isNaN(id)) {
      onStatusChange(id, status)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {colunas.map((col) => {
        const tarefasColuna = avaliacoes.filter((a) => a.status === col.id)
        return (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col gap-4 bg-muted/30 border border-border/60 rounded-3xl p-4 min-h-125 border-t-4 ${col.cor}`}
          >
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                {col.titulo}
                <span className="bg-muted text-muted-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
                  {tarefasColuna.length}
                </span>
              </h3>
              <button
                onClick={() => onAdd(col.id)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              {tarefasColuna.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <CardTarefaKanban
                    avaliacao={item}
                    materia={item.materia}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

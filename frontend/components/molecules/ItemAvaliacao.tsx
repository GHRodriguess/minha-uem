'use client'

import { Avaliacao } from "@/types/academico"
import { InputNota } from "../atoms/InputNota"
import { Button } from "../ui/button"
import { Trash2, GripVertical } from "lucide-react"
import { Input } from "../ui/input"
import { useState, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface ItemAvaliacaoProps {
  avaliacao: Avaliacao
  onUpdate: (id: number, data: Partial<Avaliacao>) => void
  onDelete: (id: number) => void
  groupType: 'PROVA' | 'ENTREGA'
}

export function ItemAvaliacao({ avaliacao, onUpdate, onDelete, groupType }: ItemAvaliacaoProps) {
  const [nomeLocal, setNomeLocal] = useState(avaliacao.nome)
  const [dataLocal, setDataLocal] = useState(avaliacao.data || "")

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: avaliacao.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    setNomeLocal(avaliacao.nome)
    setDataLocal(avaliacao.data || "")
  }, [avaliacao.nome, avaliacao.data])

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl group transition-all hover:border-primary/30 shadow-sm"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex-1 grid grid-cols-12 gap-2 items-center">
        <div className={groupType === 'PROVA' ? 'col-span-5' : 'col-span-3'}>
          <Input
            value={nomeLocal}
            onChange={(e) => setNomeLocal(e.target.value)}
            onBlur={() => nomeLocal !== avaliacao.nome && onUpdate(avaliacao.id, { nome: nomeLocal })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            placeholder="Nome (ex: P1)"
            className="bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary h-8 font-bold p-0 text-foreground"
          />
        </div>

        {groupType === 'ENTREGA' && (
          <div className="col-span-2 flex items-center">
            <select
              value={avaliacao.tipo}
              onChange={(e) => onUpdate(avaliacao.id, { tipo: e.target.value as any })}
              className="h-8 text-[10px] font-black uppercase p-1 bg-muted/30 rounded-xl border-none focus-visible:ring-1 focus-visible:ring-primary w-full cursor-pointer text-foreground outline-none"
            >
              <option value="TRABALHO" className="bg-card text-foreground">Trabalho</option>
              <option value="TAREFA" className="bg-card text-foreground">Tarefa</option>
              <option value="PESQUISA" className="bg-card text-foreground">Pesquisa</option>
              <option value="EXAME" className="bg-card text-foreground">Exame</option>
              <option value="OUTRO" className="bg-card text-foreground">Outro</option>
            </select>
          </div>
        )}
        
        <div className="col-span-2 flex items-center">
          <span className="text-[8px] font-black text-muted-foreground uppercase bg-muted rounded">Peso</span>
          <InputNota
            value={avaliacao.peso}
            onChange={(val) => onUpdate(avaliacao.id, { peso: val || 0 })}
            className="h-8 w-16 text-xs font-black min-w-auto"
          />
        </div>

        <div className="col-span-2 flex items-center">
          <span className="text-[8px] font-black text-muted-foreground uppercase bg-muted rounded">Nota</span>
          <InputNota
            value={avaliacao.nota}
            onChange={(val) => onUpdate(avaliacao.id, { nota: val })}
            className="h-8 w-16 text-sm font-black min-w-auto"
            placeholder="-"
          />
        </div>

        <div className="col-span-3 flex items-center">
          <Input
            type="date"
            value={dataLocal}
            onChange={(e) => setDataLocal(e.target.value)}
            onBlur={() => dataLocal !== (avaliacao.data || "") && onUpdate(avaliacao.id, { data: dataLocal || null })}
            className="h-8 text-[10px] font-bold uppercase p-1 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary w-full appearance-none"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(avaliacao.id)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-20 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

'use client'

import { Avaliacao } from "@/types/academico"
import { InputNota } from "../atoms/InputNota"
import { Button } from "../ui/button"
import { Trash2, GripVertical } from "lucide-react"
import { Input } from "../ui/input"

interface ItemAvaliacaoProps {
  avaliacao: Avaliacao
  onUpdate: (id: number, data: Partial<Avaliacao>) => void
  onDelete: (id: number) => void
}

export function ItemAvaliacao({ avaliacao, onUpdate, onDelete }: ItemAvaliacaoProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border group transition-all hover:border-primary/30">
      <div className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex-1 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-6">
          <Input
            value={avaliacao.nome}
            onChange={(e) => onUpdate(avaliacao.id, { nome: e.target.value })}
            placeholder="Nome (ex: P1)"
            className="bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary h-8 font-medium p-0"
          />
        </div>
        
        <div className="col-span-3 flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Peso</span>
          <InputNota
            value={avaliacao.peso}
            onChange={(val) => onUpdate(avaliacao.id, { peso: val || 1 })}
            className="h-8 w-14 text-xs"
          />
        </div>

        <div className="col-span-3 flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Nota</span>
          <InputNota
            value={avaliacao.nota}
            onChange={(val) => onUpdate(avaliacao.id, { nota: val })}
            className="h-8 w-16 text-sm"
            placeholder="-"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(avaliacao.id)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

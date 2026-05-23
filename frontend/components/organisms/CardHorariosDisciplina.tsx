'use client'

import { Calendar } from 'lucide-react'
import { Materia } from '@/types/academico'

interface CardHorariosDisciplinaProps {
  materia: Materia
}

export function CardHorariosDisciplina({ materia }: CardHorariosDisciplinaProps) {
  const sortedSchedules = [...(materia.horarios || [])].sort((a, b) => {
    if (a.dia !== b.dia) {
      return a.dia - b.dia
    }
    return a.inicio.localeCompare(b.inicio)
  })

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Horários</h2>
          <p className="text-xs text-muted-foreground font-medium">Cronograma semanal</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {sortedSchedules.map((h, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
            <div className="bg-background w-10 h-10 rounded-lg flex flex-col items-center justify-center border border-border">
              <span className="text-[10px] font-black text-muted-foreground uppercase leading-none">DIA</span>
              <span className="text-sm font-black text-primary">{h.dia + 1}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground uppercase tracking-tight">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][h.dia - 1]}
              </p>
              <p className="text-xs text-muted-foreground font-bold">
                {h.inicio.slice(0, 5)} - {h.fim.slice(0, 5)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

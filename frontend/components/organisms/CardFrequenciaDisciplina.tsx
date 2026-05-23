'use client'

import { Clock } from 'lucide-react'
import { Materia } from '@/types/academico'

interface CardFrequenciaDisciplinaProps {
  materia: Materia
}

function agruparFaltasPorDia(absences: { data: string; aula: number; faltas: number }[]) {
  const groupedAbsences = absences.reduce((accumulator, item) => {
    accumulator[item.data] = (accumulator[item.data] || 0) + item.faltas
    return accumulator
  }, {} as Record<string, number>)

  return Object.entries(groupedAbsences)
    .map(([date, total]) => ({ data: date, faltas: total }))
    .sort((a, b) => b.data.localeCompare(a.data))
}

export function CardFrequenciaDisciplina({ materia }: CardFrequenciaDisciplinaProps) {
  const firstSchedule = materia.horarios?.[0]
  const maxAbsences = firstSchedule?.maximo_faltas || 0
  const absencesPercentage = maxAbsences > 0 ? (materia.faltas_atuais / maxAbsences) * 100 : 0

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Frequência</h2>
          <p className="text-xs text-muted-foreground font-medium">Controle de ausências</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-3">
            <div className="flex items-baseline gap-1">
              <p className="text-5xl font-black text-foreground">{materia.faltas_atuais}</p>
              <p className="text-sm font-bold text-muted-foreground">faltas</p>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Limite: {maxAbsences}</p>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                materia.faltas_atuais > maxAbsences ? 'bg-destructive' : absencesPercentage >= 80 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(absencesPercentage, 100)}%` }}
            />
          </div>
        </div>

        {materia.detalhes_faltas && materia.detalhes_faltas.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Histórico Recente</p>
            <div className="flex flex-col gap-2">
              {agruparFaltasPorDia(materia.detalhes_faltas).slice(0, 3).map((f, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-3 bg-muted/30 rounded-xl border border-border/50">
                  <span className="font-bold text-foreground">{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <span className="text-primary font-black text-xs bg-primary/10 px-2 py-0.5 rounded-full">{f.faltas} F</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

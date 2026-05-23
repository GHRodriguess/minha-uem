'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarioGradeProps {
  dataSelecionada: Date
  onMudarData: (data: Date) => void
  onMudarMes: (delta: number) => void
  filtrarEventosDoDia: (data: Date) => { aulas: any[]; avaliacoes: any[] }
}

export function CalendarioGrade({
  dataSelecionada,
  onMudarData,
  onMudarMes,
  filtrarEventosDoDia
}: CalendarioGradeProps) {
  const obterDiasDoMes = () => {
    const year = dataSelecionada.getFullYear()
    const month = dataSelecionada.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const lastDay = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const formatarMesAno = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-foreground text-sm">{formatarMesAno(dataSelecionada)}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMudarMes(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMudarMes(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-2">
        <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {obterDiasDoMes().map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-10" />
          
          const isToday = new Date().toDateString() === day.toDateString()
          const isSelected = dataSelecionada.toDateString() === day.toDateString()
          const dayEvents = filtrarEventosDoDia(day)
          const hasClasses = dayEvents.aulas.length > 0
          const hasAssessments = dayEvents.avaliacoes.length > 0

          return (
            <button
              key={day.toISOString()}
              onClick={() => onMudarData(day)}
              className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                isSelected 
                  ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' 
                  : 'hover:bg-muted text-foreground'
              } ${isToday && !isSelected ? 'border border-primary/50' : ''}`}
            >
              <span className="text-sm">{day.getDate()}</span>
              <div className="flex gap-0.5 absolute bottom-1">
                {hasClasses && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                )}
                {hasAssessments && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-yellow-500'}`} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

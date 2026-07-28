'use client'

import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Materia, Horario } from '@/types/academico'
import ItemEventoAvaliacao from '../molecules/ItemEventoAvaliacao'
import ItemEventoAula from '../molecules/ItemEventoAula'

interface CalendarioListaEventosProps {
  dataSelecionada: Date
  eventosHoje: {
    aulas: { materia: Materia; horario: Horario }[]
    avaliacoes: { materia: Materia; avaliacao: any }[]
  }
  filtros: {
    aulas: boolean
    avaliacoes: boolean
  }
  onAlternarFalta: (materiaId: number, dataStr: string, aulaNum: number, temFalta: boolean) => Promise<void>
}

export function CalendarioListaEventos({
  dataSelecionada,
  eventosHoje,
  filtros,
  onAlternarFalta
}: CalendarioListaEventosProps) {
  const formatarData = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const activeAulas = filtros.aulas ? eventosHoje.aulas : []
  const activeAvaliacoes = filtros.avaliacoes ? eventosHoje.avaliacoes : []
  const totalCount = activeAulas.length + activeAvaliacoes.length

  const year = dataSelecionada.getFullYear()
  const month = String(dataSelecionada.getMonth() + 1).padStart(2, '0')
  const day = String(dataSelecionada.getDate()).padStart(2, '0')
  const dataString = `${year}-${month}-${day}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl">
          <CalendarIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{formatarData(dataSelecionada)}</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} compromissos filtrados
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activeAvaliacoes.map((item, idx) => (
          <ItemEventoAvaliacao key={`av-${idx}`} item={item} />
        ))}

        {activeAulas.map((aula, idx) => (
          <ItemEventoAula
            key={`${aula.materia.id}-${idx}`}
            aula={aula}
            dataString={dataString}
            onAlternarFalta={onAlternarFalta}
          />
        ))}

        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border text-muted-foreground">
            <Clock className="w-12 h-12 mb-4 opacity-10" />
            <p className="font-medium">Nada programado para este dia.</p>
            <p className="text-xs">Aproveite para descansar ou adiantar matérias!</p>
          </div>
        )}
      </div>
    </div>
  )
}

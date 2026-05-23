'use client'

import Link from 'next/link'
import { Calendar as CalendarIcon, Clock, MapPin, UserX, Trophy, BookOpen, CheckSquare, Search, Award, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Materia, Horario } from '@/types/academico'

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

function obterConfiguracaoTipo(type: string) {
  switch (type) {
    case 'PROVA':
      return {
        bg: 'bg-yellow-500/5',
        border: 'border-yellow-500/20 hover:border-yellow-500/50',
        text: 'text-yellow-500',
        badge: 'bg-yellow-500 text-white',
        icon: Trophy,
        label: 'Prova'
      }
    case 'TRABALHO':
      return {
        bg: 'bg-green-500/5',
        border: 'border-green-500/20 hover:border-green-500/50',
        text: 'text-green-500',
        badge: 'bg-green-500 text-white',
        icon: BookOpen,
        label: 'Trabalho'
      }
    case 'TAREFA':
      return {
        bg: 'bg-purple-500/5',
        border: 'border-purple-500/20 hover:border-purple-500/50',
        text: 'text-purple-500',
        badge: 'bg-purple-500 text-white',
        icon: CheckSquare,
        label: 'Tarefa'
      }
    case 'PESQUISA':
      return {
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20 hover:border-blue-500/50',
        text: 'text-blue-500',
        badge: 'bg-blue-500 text-white',
        icon: Search,
        label: 'Pesquisa'
      }
    case 'EXAME':
      return {
        bg: 'bg-orange-500/5',
        border: 'border-orange-500/20 hover:border-orange-500/50',
        text: 'text-orange-500',
        badge: 'bg-orange-500 text-white',
        icon: Award,
        label: 'Exame'
      }
    default:
      return {
        bg: 'bg-slate-500/5',
        border: 'border-slate-500/20 hover:border-slate-500/50',
        text: 'text-slate-500',
        badge: 'bg-slate-500 text-white',
        icon: HelpCircle,
        label: 'Outro'
      }
  }
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
        {activeAvaliacoes.map((item, idx) => {
          const config = obterConfiguracaoTipo(item.avaliacao.tipo)
          const Icone = config.icon
          return (
            <div key={`av-${idx}`} className={`${config.bg} ${config.border} border rounded-2xl p-5 shadow-sm transition-colors flex items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className={`${config.bg} w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${config.border}`}>
                  <Icone className={`w-8 h-8 ${config.text}`} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground leading-tight">{item.avaliacao.nome}</h4>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    <Link href={`/disciplinas/${item.materia.id}`} className="hover:underline hover:text-primary transition-colors">
                      {item.materia.nome}
                    </Link>
                    {' '}• {config.label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black ${config.badge} px-3 py-1 rounded-full uppercase`}>
                  Peso {item.avaliacao.peso}
                </span>
              </div>
            </div>
          )
        })}

        {activeAulas.map((aula, idx) => {
          const temFalta = aula.materia.detalhes_faltas?.some(
            f => f.data === dataString && f.aula === aula.horario.aula && f.faltas > 0
          )

          return (
            <div key={`${aula.materia.id}-${idx}`} className={`bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${temFalta ? 'opacity-50 grayscale' : ''}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="bg-muted w-16 h-16 rounded-xl flex flex-col items-center justify-center border border-border shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Aula</span>
                  <span className="text-2xl font-black text-foreground">{aula.horario.aula}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-lg text-foreground leading-tight truncate">
                      <Link href={`/disciplinas/${aula.materia.id}`} className="hover:underline hover:text-primary transition-colors">
                        {aula.materia.nome}
                      </Link>
                    </h4>
                    {temFalta && (
                      <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full uppercase shrink-0">Falta Marcada</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-medium truncate">
                    {aula.materia.codigo} • Turma {aula.horario.turma}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-8 text-sm shrink-0">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {aula.horario.inicio.substring(0, 5)} - {aula.horario.fim.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Sala {aula.horario.sala}</span>
                  </div>
                </div>
                
                <Button 
                  variant={temFalta ? "destructive" : "outline"} 
                  size="sm" 
                  className="rounded-xl gap-2 font-bold uppercase text-[10px]"
                  onClick={() => onAlternarFalta(aula.materia.id, dataString, aula.horario.aula, !!temFalta)}
                >
                  <UserX className="w-4 h-4" />
                  {temFalta ? "Remover Falta" : "Marcar Falta"}
                </Button>
              </div>
            </div>
          )
        })}

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

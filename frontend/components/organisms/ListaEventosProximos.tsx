'use client'

import Link from 'next/link'
import { Calendar, Trophy, BookOpen, CheckSquare, Search, Award, HelpCircle } from 'lucide-react'
import { Materia, Avaliacao } from '@/types/academico'

interface ListaEventosProximosProps {
  materias: Materia[]
  dataString: string
}

function obterConfiguracaoTipo(type: string) {
  switch (type) {
    case 'PROVA':
      return { bg: 'bg-primary/10 border-primary/20 text-primary', icon: Trophy, label: 'Prova' }
    case 'TRABALHO':
      return { bg: 'bg-primary/10 border-primary/20 text-primary', icon: BookOpen, label: 'Trabalho' }
    case 'TAREFA':
      return { bg: 'bg-primary/10 border-primary/20 text-primary', icon: CheckSquare, label: 'Tarefa' }
    case 'PESQUISA':
      return { bg: 'bg-primary/10 border-primary/20 text-primary', icon: Search, label: 'Pesquisa' }
    case 'EXAME':
      return { bg: 'bg-primary/10 border-primary/20 text-primary', icon: Award, label: 'Exame' }
    default:
      return { bg: 'bg-muted border-border text-muted-foreground', icon: HelpCircle, label: 'Outro' }
  }
}

export function ListaEventosProximos({ materias, dataString }: ListaEventosProximosProps) {
  const events: { materia: Materia; avaliacao: Avaliacao }[] = []
  
  materias.forEach(m => {
    m.configuracao_notas?.avaliacoes?.forEach(av => {
      if (av.data && av.data >= dataString) {
        events.push({ materia: m, avaliacao: av })
      }
    })
  })

  const sortedEvents = events.sort((a, b) => (a.avaliacao.data || '').localeCompare(b.avaliacao.data || ''))

  return (
    <div className="space-y-4">
      {sortedEvents.length > 0 ? (
        sortedEvents.slice(0, 5).map((item, idx) => {
          const config = obterConfiguracaoTipo(item.avaliacao.tipo)
          const Icon = config.icon
          const dateObj = new Date((item.avaliacao.data || '') + 'T12:00:00')
          
          return (
            <div 
              key={`ev-${idx}`} 
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${config.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground leading-tight truncate">
                    {item.avaliacao.nome}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 font-medium truncate">
                    <Link href={`/disciplinas/${item.materia.id}`} className="hover:underline hover:text-primary transition-colors">
                      {item.materia.nome}
                    </Link>
                    {' • '}
                    {config.label}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                  {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
                <span className="text-[9px] font-black text-primary uppercase block mt-0.5">
                  Peso {item.avaliacao.peso}
                </span>
              </div>
            </div>
          )
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
          <Calendar className="w-10 h-10 mb-3 opacity-25 text-primary" />
          <p className="text-sm font-semibold">Sem avaliações ou prazos próximos.</p>
        </div>
      )}
    </div>
  )
}

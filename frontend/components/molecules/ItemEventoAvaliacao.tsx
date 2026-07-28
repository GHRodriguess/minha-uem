'use client'

import Link from 'next/link'
import { Trophy, BookOpen, CheckSquare, Search, Award, HelpCircle } from 'lucide-react'
import { Materia } from '@/types/academico'

interface ItemEventoAvaliacaoProps {
  item: { materia: Materia; avaliacao: any }
}

function obterConfiguracaoTipo(type: string) {
  switch (type) {
    case 'PROVA':
      return { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20 hover:border-yellow-500/50', text: 'text-yellow-500', badge: 'bg-yellow-500 text-white', icon: Trophy, label: 'Prova' }
    case 'TRABALHO':
      return { bg: 'bg-green-500/5', border: 'border-green-500/20 hover:border-green-500/50', text: 'text-green-500', badge: 'bg-green-500 text-white', icon: BookOpen, label: 'Trabalho' }
    case 'TAREFA':
      return { bg: 'bg-purple-500/5', border: 'border-purple-500/20 hover:border-purple-500/50', text: 'text-purple-500', badge: 'bg-purple-500 text-white', icon: CheckSquare, label: 'Tarefa' }
    case 'PESQUISA':
      return { bg: 'bg-blue-500/5', border: 'border-blue-500/20 hover:border-blue-500/50', text: 'text-blue-500', badge: 'bg-blue-500 text-white', icon: Search, label: 'Pesquisa' }
    case 'EXAME':
      return { bg: 'bg-orange-500/5', border: 'border-orange-500/20 hover:border-orange-500/50', text: 'text-orange-500', badge: 'bg-orange-500 text-white', icon: Award, label: 'Exame' }
    default:
      return { bg: 'bg-slate-500/5', border: 'border-slate-500/20 hover:border-slate-500/50', text: 'text-slate-500', badge: 'bg-slate-500 text-white', icon: HelpCircle, label: 'Outro' }
  }
}

export default function ItemEventoAvaliacao({ item }: ItemEventoAvaliacaoProps) {
  const config = obterConfiguracaoTipo(item.avaliacao.tipo)
  const Icone = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-2xl p-5 shadow-sm transition-colors space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className={`${config.bg} w-14 h-14 rounded-xl flex flex-col items-center justify-center border ${config.border} shrink-0`}>
            <Icone className={`w-7 h-7 ${config.text}`} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-bold text-base sm:text-lg text-foreground leading-snug break-words">{item.avaliacao.nome}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium break-words">
              <Link href={`/disciplinas/${item.materia.id}`} className="hover:underline hover:text-primary transition-colors">
                {item.materia.nome}
              </Link>
              {' '}• {config.label}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <span className={`text-[10px] font-black ${config.badge} px-3 py-1 rounded-full uppercase whitespace-nowrap`}>
            Peso {item.avaliacao.peso}
          </span>
        </div>
      </div>
    </div>
  )
}

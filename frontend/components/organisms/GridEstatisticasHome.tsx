'use client'

import { GraduationCap, BookOpen, Calendar, Clock } from 'lucide-react'
import { Perfil, Horario, Materia } from '@/types/academico'

interface GridEstatisticasHomeProps {
  profile: Perfil
  activeYearLabel: string | number
  nextClass?: { materia: Materia; horario: Horario }
}

export function GridEstatisticasHome({ profile, activeYearLabel, nextClass }: GridEstatisticasHomeProps) {
  const cards = [
    { icon: GraduationCap, bg: 'bg-primary/10 text-primary', label: 'Curso', val: `${profile.curso?.codigo} - ${profile.curso?.nome}` },
    { icon: BookOpen, bg: 'bg-primary/10 text-primary', label: 'Disciplinas', val: profile.materias?.length || 0 },
    { icon: Calendar, bg: 'bg-primary/10 text-primary', label: 'Ano Letivo', val: activeYearLabel },
    { icon: Clock, bg: 'bg-primary/10 text-primary', label: 'Próxima Aula', val: nextClass ? nextClass.horario.inicio.substring(0, 5) : 'Sem mais hoje' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-32">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} shrink-0`}>
            <c.icon className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{c.label}</p>
            <p className="text-base font-bold text-foreground mt-1 truncate" title={String(c.val)}>{c.val}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

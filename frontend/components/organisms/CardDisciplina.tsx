'use client'

import Link from 'next/link'
import { BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { Materia } from '@/types/academico'

interface CardDisciplinaProps {
  materia: Materia
}

export function CardDisciplina({ materia }: CardDisciplinaProps) {
  const { unreadNotifications } = useClassroom()

  const firstSchedule = materia.horarios?.[0]
  if (!firstSchedule) return null

  const maxAbsences = firstSchedule.maximo_faltas
  const absencesPercentage = (materia.faltas_atuais / maxAbsences) * 100
  const isAtLimit = absencesPercentage >= 80
  const isFailed = materia.faltas_atuais > maxAbsences

  const subjectNotification = unreadNotifications?.atualizacoes.find(
    (upd) => upd.materia_id === materia.id
  )
  const hasUnreadMessages = subjectNotification && subjectNotification.mensagens.length > 0
  const totalUnread = subjectNotification ? subjectNotification.mensagens.length : 0

  return (
    <Link 
      href={`/disciplinas/${materia.id}`}
      className="group bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{materia.nome}</h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {materia.codigo} • Turma {firstSchedule.turma}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
              {firstSchedule.departamento}
            </span>
            {hasUnreadMessages && (
              <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                +{totalUnread} novidade{totalUnread > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Faltas</p>
              <p className="text-3xl font-black text-foreground">
                {materia.faltas_atuais} <span className="text-sm font-normal text-muted-foreground">/ {maxAbsences}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
              Ver detalhes
              <BookOpen className="w-3 h-3" />
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isFailed ? 'bg-destructive' : isAtLimit ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(absencesPercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            {isFailed ? (
              <div className="flex items-center gap-1.5 text-destructive font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                Reprovado por faltas
              </div>
            ) : isAtLimit ? (
              <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                Atenção ao limite de faltas
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4" />
                Frequência regular
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest">
        <span>Início: {new Date(firstSchedule.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
        <span>Término: {new Date(firstSchedule.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
      </div>
    </Link>
  )
}

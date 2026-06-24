'use client'

import Link from 'next/link'
import { Materia } from '@/types/academico'
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { obterDataFormatada } from '@/lib/utils'

interface CardMateriaHomeProps {
  subject: Materia
}

const statusStyles: Record<string, string> = {
  APROVADO: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  EXAME: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  REPROVADO: 'bg-destructive/10 text-destructive border-destructive/20'
}

const statusLabels: Record<string, string> = {
  APROVADO: 'Aprovado', EXAME: 'Exame', REPROVADO: 'Reprovado'
}

export function CardMateriaHome({ subject }: CardMateriaHomeProps) {
  const firstSchedule = subject.horarios?.[0]
  if (!firstSchedule) return null

  const maxAbsences = firstSchedule.maximo_faltas || 0
  const absencesPercentage = maxAbsences > 0 ? (subject.faltas_atuais / maxAbsences) * 100 : 0
  const isFailed = subject.faltas_atuais > maxAbsences
  const isAtRisk = absencesPercentage >= 80

  const average = subject.configuracao_notas?.media_atual ?? 0
  const currentStatus = subject.configuracao_notas?.approval_status ?? 'EM_ANDAMENTO'
  const pointsNeeded = subject.configuracao_notas?.quanto_falta ?? 0

  const todayStr = obterDataFormatada(new Date())
  const isInProgress = todayStr >= firstSchedule.data_inicio && todayStr <= firstSchedule.data_termino
  const isUpcoming = todayStr < firstSchedule.data_inicio

  const resolvedStyle = isInProgress
    ? 'bg-primary/10 text-primary border-primary/20'
    : isUpcoming
    ? 'bg-muted text-muted-foreground border-border'
    : (statusStyles[currentStatus] || 'bg-muted text-muted-foreground border-border')

  const resolvedLabel = isInProgress
    ? 'Em Curso'
    : isUpcoming
    ? 'Não Iniciada'
    : (statusLabels[currentStatus] || 'Encerrada')

  return (
    <Link 
      href={`/disciplinas/${subject.id}`}
      className="group bg-card/60 backdrop-blur-xs border border-border/50 rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.99] flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors truncate" title={subject.nome}>
              {subject.nome}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{subject.codigo} • T. {firstSchedule.turma}</p>
          </div>
          <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">{firstSchedule.departamento}</span>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {isFailed ? (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-bounce" />
              ) : isAtRisk ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
              Faltas: <strong className="text-foreground">{subject.faltas_atuais}</strong> / {maxAbsences}
            </span>
            <span>{Math.round(absencesPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${isFailed ? 'bg-destructive' : isAtRisk ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(absencesPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Média</p>
            <p className="font-bold text-foreground text-sm mt-0.5">{average.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Situação</p>
            <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase mt-0.5 ${resolvedStyle}`}>{resolvedLabel}</span>
          </div>
          {pointsNeeded > 0 && currentStatus === 'EM_ANDAMENTO' && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Falta</p>
              <p className="font-bold text-primary text-sm mt-0.5">{pointsNeeded.toFixed(1)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 mt-4 pt-3 flex justify-end">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary group-hover:underline uppercase tracking-wider">
          Gerenciar
          <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  )
}

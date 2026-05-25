'use client'

import Link from 'next/link'
import { Materia } from '@/types/academico'
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'

interface CardMateriaHomeProps {
  materia: Materia
}

export function CardMateriaHome({ materia }: CardMateriaHomeProps) {
  const firstSchedule = materia.horarios?.[0]
  if (!firstSchedule) return null

  const maxAbsences = firstSchedule.maximo_faltas || 0
  const absencesPercentage = maxAbsences > 0 ? (materia.faltas_atuais / maxAbsences) * 100 : 0
  const isFailed = materia.faltas_atuais > maxAbsences
  const isAtRisk = absencesPercentage >= 80

  const average = materia.configuracao_notas?.media_atual ?? 0
  const status = materia.configuracao_notas?.approval_status ?? 'EM_ANDAMENTO'
  const needed = materia.configuracao_notas?.quanto_falta ?? 0

  const todayStr = new Date().toISOString().split('T')[0]
  const isEmCurso = todayStr >= firstSchedule.data_inicio && todayStr <= firstSchedule.data_termino
  const isUpcoming = todayStr < firstSchedule.data_inicio

  const obterEstiloStatus = () => {
    if (isEmCurso) return 'bg-primary/10 text-primary border-primary/20'
    if (isUpcoming) return 'bg-muted text-muted-foreground border-border'
    const Estilos: Record<string, string> = {
      APROVADO: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      EXAME: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      REPROVADO: 'bg-destructive/10 text-destructive border-destructive/20'
    }
    return Estilos[status] || 'bg-muted text-muted-foreground border-border'
  }

  const obterLabelStatus = () => {
    if (isEmCurso) return 'Em Curso'
    if (isUpcoming) return 'Não Iniciada'
    const Labels: Record<string, string> = { APROVADO: 'Aprovado', EXAME: 'Exame', REPROVADO: 'Reprovado' }
    return Labels[status] || 'Encerrada'
  }

  return (
    <Link 
      href={`/disciplinas/${materia.id}`}
      className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors truncate" title={materia.nome}>
              {materia.nome}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {materia.codigo} • T. {firstSchedule.turma}
            </p>
          </div>
          <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
            {firstSchedule.departamento}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {isFailed ? (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              ) : isAtRisk ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
              Faltas: <strong className="text-foreground">{materia.faltas_atuais}</strong> / {maxAbsences}
            </span>
            <span>{Math.round(absencesPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isFailed ? 'bg-destructive' : isAtRisk ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(absencesPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Média</p>
            <p className="font-bold text-foreground text-sm mt-0.5">{average.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Situação</p>
            <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase mt-0.5 ${obterEstiloStatus()}`}>
              {obterLabelStatus()}
            </span>
          </div>
          {needed > 0 && status === 'EM_ANDAMENTO' && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Falta</p>
              <p className="font-bold text-primary text-sm mt-0.5">{needed.toFixed(1)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 mt-4 pt-3 flex justify-end">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline uppercase tracking-wider text-[10px]">
          Gerenciar
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}

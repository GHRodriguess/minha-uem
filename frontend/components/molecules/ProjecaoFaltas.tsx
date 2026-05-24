'use client'

import { Materia } from '@/types/academico'
import { AlertTriangle, ShieldCheck, Compass } from 'lucide-react'

interface ProjecaoFaltasProps {
  materia: Materia
}

export function ProjecaoFaltas({ materia }: ProjecaoFaltasProps) {
  const absencesLimit = materia.max_absences ?? 0
  const remaining = materia.remaining_absences ?? 0
  const attendance = materia.current_attendance_percentage ?? 100
  const isRisk = materia.absences_risk_zone ?? false
  const toleratedWeeks = materia.weeks_tolerated_absences ?? 0
  const isFailed = materia.faltas_atuais > absencesLimit

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Projeção Inteligente de Faltas</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/40 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Frequência Real</p>
          <p className="text-xl font-black text-foreground">{attendance.toFixed(1)}%</p>
        </div>

        <div className="bg-muted/40 p-3 rounded-xl border border-border/50 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Faltas Disponíveis</p>
          <p className={`text-xl font-black ${isFailed ? 'text-destructive' : remaining <= 2 ? 'text-destructive' : 'text-primary'}`}>
            {isFailed ? 0 : remaining}
          </p>
        </div>
      </div>

      {isFailed ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-xs text-destructive font-bold animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <p className="uppercase tracking-wide text-xs font-black">Reprovado por Falta</p>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              Você ultrapassou o limite máximo de {absencesLimit} faltas permitido para esta disciplina.
            </p>
          </div>
        </div>
      ) : isRisk ? (
        <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-xl flex items-start gap-3 text-xs text-destructive font-bold animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="uppercase tracking-wide">Zona de Risco Crítico!</p>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              Você já consumiu a margem de segurança. Não falte nas próximas semanas para evitar reprovação por frequência!
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3 text-xs text-primary font-bold">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="uppercase tracking-wide">Frequência Segura</p>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              {toleratedWeeks > 0 ? (
                `Sua presença está estável. Você ainda suporta até ${toleratedWeeks} semanas inteiras de faltas sem reprovar.`
              ) : (
                'Frequência estável e dentro da margem permitida.'
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

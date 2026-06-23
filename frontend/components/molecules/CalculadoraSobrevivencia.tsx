'use client'

import { useState } from 'react'
import { ConfiguracaoMateria } from '@/types/academico'
import { Info, Sparkles, GraduationCap } from 'lucide-react'

interface CalculadoraSobrevivenciaProps {
  config: ConfiguracaoMateria
}

export function CalculadoraSobrevivencia({ config }: CalculadoraSobrevivenciaProps) {
  const [simulatedGrades, setSimulatedGrades] = useState<Record<number, number>>({})

  const unassignedAssessments = config.avaliacoes.filter(a => a.nota === null)
  
  const obterResultadoSimulado = () => {
    const totalWeights = config.avaliacoes.reduce((acc, a) => acc + Number(a.peso), 0)
    const currentSum = config.avaliacoes.reduce((acc, a) => acc + (a.nota !== null ? Number(a.nota) * Number(a.peso) : 0), 0)
    
    let simulatedSum = 0
    unassignedAssessments.forEach(a => {
      const value = simulatedGrades[a.id] ?? 0
      simulatedSum += value * Number(a.peso)
    })

    const projected = totalWeights > 0 ? (currentSum + simulatedSum) / totalWeights : 0
    const roundedProjected = Math.round(projected * 100) / 100

    let status = 'EM_ANDAMENTO'
    let examRequired = 0

    if (unassignedAssessments.length === 0 || Object.keys(simulatedGrades).length === unassignedAssessments.length) {
      if (roundedProjected >= (config.media_minima ?? 6.0)) {
        status = 'APROVADO'
      } else if (roundedProjected >= 3.0) {
        status = 'EXAME'
        examRequired = Math.max(0, 10.0 - roundedProjected)
      } else {
        status = 'REPROVADO'
      }
    }

    return { projected: roundedProjected, status, examRequired }
  }

  const tratarAlteracaoNota = (id: number, val: string) => {
    const parsed = Math.min(10, Math.max(0, parseFloat(val) || 0))
    setSimulatedGrades(prev => ({ ...prev, [id]: parsed }))
  }

  const { projected, status, examRequired } = obterResultadoSimulado()

  return (
    <div className="mt-6 bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Calculadora de Sobrevivência</h3>
      </div>

      {unassignedAssessments.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground font-medium">Simule as notas das provas restantes:</p>
          <div className="space-y-3">
            {unassignedAssessments.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-4 text-xs">
                <span className="font-semibold text-muted-foreground truncate">{a.nome} (Peso {a.peso})</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={simulatedGrades[a.id] ?? ''}
                  placeholder="Nota (0-10)"
                  onChange={e => tratarAlteracaoNota(a.id, e.target.value)}
                  className="w-27 px-2 py-1 bg-muted border border-border rounded-lg text-foreground font-bold text-center"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Média Projetada</p>
              <p className="text-2xl font-black text-foreground">{projected.toFixed(2)}</p>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Status Projetado</p>
              <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                status === 'APROVADO' ? 'bg-green-500/10 text-green-500' :
                status === 'EXAME' ? 'bg-amber-500/10 text-amber-500' :
                status === 'REPROVADO' ? 'bg-destructive/10 text-destructive' :
                'bg-primary/10 text-primary'
              }`}>
                {status === 'APROVADO' ? 'Aprovado' :
                 status === 'EXAME' ? 'Exame' :
                 status === 'REPROVADO' ? 'Reprovado' :
                 'Simulando'}
              </span>
            </div>
          </div>

          {status === 'EXAME' && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 font-medium">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Nota mínima exigida no Exame Final: <strong className="font-bold">{examRequired.toFixed(2)}</strong></span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border/50 rounded-xl">
          <GraduationCap className="w-5 h-5 text-primary shrink-0" />
          <div className="text-xs font-medium">
            {config.media_atual >= (config.media_minima ?? 6.0) ? (
              <p className="text-green-500 font-bold">Parabéns! Você já foi aprovado nesta disciplina!</p>
            ) : config.media_atual >= 3.0 ? (
              <p className="text-amber-500 font-bold">Você está de Exame Final. Nota necessária: {(10.0 - config.media_atual).toFixed(2)}</p>
            ) : (
              <p className="text-destructive font-bold">Reprovado. Média final abaixo de 3.0.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

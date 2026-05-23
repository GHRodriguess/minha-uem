'use client'

import { Timer } from 'lucide-react'
import { Materia } from '@/types/academico'

interface CardPrazosDisciplinaProps {
  materia: Materia
}

export function CardPrazosDisciplina({ materia }: CardPrazosDisciplinaProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingAssessments = (materia.configuracao_notas?.avaliacoes || [])
    .filter(a => a.data && new Date(a.data + 'T12:00:00') >= today && a.nota === null)
    .sort((a, b) => a.data!.localeCompare(b.data!))
    .slice(0, 3)

  const calcularDiasRestantes = (dataStr: string) => {
    const targetDate = new Date(dataStr + 'T12:00:00')
    const targetDateClear = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const diffTime = targetDateClear.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Amanhã'
    return `Em ${diffDays} dias`
  }

  if (upcomingAssessments.length === 0) return null

  return (
    <div className="bg-primary border border-primary/20 rounded-3xl p-8 shadow-lg shadow-primary/10 text-primary-foreground">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-white/20 p-2.5 rounded-xl">
          <Timer className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Próximos Prazos</h2>
          <p className="text-xs text-white/60 font-bold uppercase tracking-wider">Fique atento!</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {upcomingAssessments.map((a, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-black uppercase tracking-tight">{a.nome}</p>
              <p className="text-[10px] font-bold text-white/60 uppercase">
                {new Date(a.data! + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <span className="text-xs font-black bg-white text-primary px-2.5 py-1 rounded-full shadow-sm uppercase">
              {calcularDiasRestantes(a.data!)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

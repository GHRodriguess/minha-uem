'use client'

import { EstatisticasAdmin } from '@/lib/api/suporte'
import { Users, GraduationCap, Calendar, TicketCheck } from 'lucide-react'
import CardMetricaAdmin from '@/components/molecules/CardMetricaAdmin'

interface VisualizadorEstatisticasProps {
  estatisticas: EstatisticasAdmin | null
}

export default function VisualizadorEstatisticas({ estatisticas }: VisualizadorEstatisticasProps) {
  if (!estatisticas) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-32 bg-muted border border-border rounded-2xl" />
        ))}
      </div>
    )
  }

  const metricas = [
    {
      titulo: 'Usuários Cadastrados',
      valor: estatisticas.total_users,
      icone: Users,
      corGradiente: 'from-blue-500 to-indigo-600'
    },
    {
      titulo: 'Perfis Acadêmicos',
      valor: estatisticas.active_profiles,
      icone: GraduationCap,
      corGradiente: 'from-purple-500 to-pink-600'
    },
    {
      titulo: 'Cursos Sincronizados',
      valor: estatisticas.total_courses,
      icone: Calendar,
      corGradiente: 'from-amber-500 to-orange-600'
    },
    {
      titulo: 'Chamados Abertos',
      valor: estatisticas.open_tickets,
      icone: TicketCheck,
      corGradiente: 'from-rose-500 to-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricas.map((m, index) => (
        <CardMetricaAdmin key={index} {...m} />
      ))}
    </div>
  )
}

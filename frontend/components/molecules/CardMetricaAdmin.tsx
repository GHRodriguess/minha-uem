'use client'

import { LucideIcon } from 'lucide-react'

interface CardMetricaAdminProps {
  titulo: string
  valor: number | string
  icone: LucideIcon
  corGradiente: string
}

export default function CardMetricaAdmin({ titulo, valor, icone: Icone, corGradiente }: CardMetricaAdminProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-linear-to-br ${corGradiente} opacity-5 -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500`} />
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{titulo}</p>
          <h3 className="text-3xl font-black tracking-tight text-foreground">{valor}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-linear-to-br ${corGradiente} text-white`}>
          <Icone className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

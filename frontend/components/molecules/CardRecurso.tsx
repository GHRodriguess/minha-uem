'use client'

import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface PropriedadesCardRecurso {
  icon: LucideIcon
  titulo: string
  descricao: string
  className?: string
}

export default function CardRecurso({
  icon: Icon,
  titulo,
  descricao,
  className
}: PropriedadesCardRecurso) {
  return (
    <div
      className={clsx(
        "group relative p-6 bg-card border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 flex flex-col items-start gap-4",
        className
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-radial from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 z-10">
        <Icon className="w-6 h-6" />
      </div>
      
      <div className="space-y-2 z-10">
        <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
          {titulo}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {descricao}
        </p>
      </div>
    </div>
  )
}

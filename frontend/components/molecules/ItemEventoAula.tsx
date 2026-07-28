'use client'

import Link from 'next/link'
import { Clock, MapPin, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Materia, Horario } from '@/types/academico'

interface ItemEventoAulaProps {
  aula: { materia: Materia; horario: Horario }
  dataString: string
  onAlternarFalta: (materiaId: number, dataStr: string, aulaNum: number, temFalta: boolean) => Promise<void>
}

export default function ItemEventoAula({ aula, dataString, onAlternarFalta }: ItemEventoAulaProps) {
  const temFalta = aula.materia.detalhes_faltas?.some(
    f => f.data === dataString && f.aula === aula.horario.aula && f.faltas > 0
  )

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors space-y-4 ${temFalta ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="bg-muted w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-border shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Aula</span>
            <span className="text-xl font-black text-foreground">{aula.horario.aula}</span>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-base sm:text-lg text-foreground leading-snug break-words">
                <Link href={`/disciplinas/${aula.materia.id}`} className="hover:underline hover:text-primary transition-colors">
                  {aula.materia.nome}
                </Link>
              </h4>
              {temFalta && (
                <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Falta Marcada
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {aula.materia.codigo} • Turma {aula.horario.turma}
            </p>
          </div>
        </div>

        <Button
          variant={temFalta ? "destructive" : "outline"}
          size="sm"
          className="rounded-xl gap-2 font-bold uppercase text-[10px] h-9 px-3 shrink-0"
          onClick={() => onAlternarFalta(aula.materia.id, dataString, aula.horario.aula, !!temFalta)}
        >
          <UserX className="w-4 h-4" />
          {temFalta ? "Remover Falta" : "Marcar Falta"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-border/40 text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>{aula.horario.inicio.substring(0, 5)} - {aula.horario.fim.substring(0, 5)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>Sala {aula.horario.sala}</span>
        </div>
      </div>
    </div>
  )
}

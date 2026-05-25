'use client'

import Link from 'next/link'
import { Clock, MapPin, UserX, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Materia, Horario } from '@/types/academico'

interface CalendarioEventosHojeProps {
  aulasHoje: { materia: Materia; horario: Horario }[]
  dataString: string
  onAlternarFalta: (materiaId: number, dataStr: string, aulaNum: number, temFalta: boolean) => Promise<void>
}

export function CalendarioEventosHoje({ aulasHoje, dataString, onAlternarFalta }: CalendarioEventosHojeProps) {
  return (
    <div className="space-y-4">
      {aulasHoje.length > 0 ? (
        aulasHoje.map((aula, idx) => {
          const temFalta = aula.materia.detalhes_faltas?.some(
            f => f.data === dataString && f.aula === aula.horario.aula && f.faltas > 0
          )

          return (
            <div 
              key={`${aula.materia.id}-${idx}`} 
              className={`bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between gap-4 ${temFalta ? 'opacity-65 grayscale-20' : ''}`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="bg-muted w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-border shrink-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Aula</span>
                  <span className="text-xl font-black text-foreground">{aula.horario.aula}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link 
                      href={`/disciplinas/${aula.materia.id}`} 
                      className="font-bold text-base text-foreground hover:text-primary transition-colors hover:underline truncate block"
                    >
                      {aula.materia.nome}
                    </Link>
                    {temFalta && (
                      <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full uppercase shrink-0">Falta</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium truncate">
                    {aula.materia.codigo} • Turma {aula.horario.turma}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0 justify-between w-full md:w-auto border-t md:border-t-0 border-border/50 pt-3 md:pt-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{aula.horario.inicio.substring(0, 5)} - {aula.horario.fim.substring(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Sala {aula.horario.sala}</span>
                  </div>
                </div>
                
                <Button 
                  variant={temFalta ? "destructive" : "outline"} 
                  size="sm" 
                  className="rounded-xl gap-1.5 font-bold uppercase text-[9px] h-9"
                  onClick={() => onAlternarFalta(aula.materia.id, dataString, aula.horario.aula, !!temFalta)}
                >
                  <UserX className="w-3.5 h-3.5" />
                  {temFalta ? "Remover" : "Falta"}
                </Button>
              </div>
            </div>
          )
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
          <Calendar className="w-10 h-10 mb-3 opacity-25 text-primary" />
          <p className="text-sm font-semibold">Nenhuma aula programada para hoje.</p>
        </div>
      )}
    </div>
  )
}

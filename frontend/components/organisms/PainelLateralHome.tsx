'use client'

import { Materia, Horario } from '@/types/academico'
import { CalendarioEventosHoje } from './CalendarioEventosHoje'
import { ListaEventosProximos } from './ListaEventosProximos'

interface PainelLateralHomeProps {
  aulasHoje: { materia: Materia; horario: Horario }[]
  dataString: string
  onAlternarFalta: (materiaId: number, dataStr: string, classNum: number, temFalta: boolean) => Promise<void>
  materias: Materia[]
}

export function PainelLateralHome({ aulasHoje, dataString, onAlternarFalta, materias }: PainelLateralHomeProps) {
  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider">Horário Hoje</h3>
        <CalendarioEventosHoje aulasHoje={aulasHoje} dataString={dataString} onAlternarFalta={onAlternarFalta} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider">Avaliações Próximas</h3>
        <ListaEventosProximos materias={materias} dataString={dataString} />
      </div>
    </div>
  )
}

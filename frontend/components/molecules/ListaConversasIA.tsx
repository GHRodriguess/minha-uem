'use client'

import React, { useState } from 'react'
import { Plus, Folder, ChevronDown, ChevronRight } from 'lucide-react'
import { GrupoConversas, Conversa } from '@/lib/api/ia'
import { Button } from '@/components/ui/button'
import ItemConversaIA from '../atoms/ItemConversaIA'

interface ListaConversasIAProps {
  conversas: GrupoConversas
  conversaAtiva: Conversa | null
  onSelecionar: (conversa: Conversa) => void
  onExcluir: (id: number) => void
  onCriar: () => void
  loading: boolean
}

export default function ListaConversasIA({
  conversas,
  conversaAtiva,
  onSelecionar,
  onExcluir,
  onCriar,
  loading
}: ListaConversasIAProps) {
  const [expandedMaterias, setExpandedMaterias] = useState<Record<number, boolean>>({})

  const alternarMateria = (materiaId: number) => {
    setExpandedMaterias(p => ({ ...p, [materiaId]: !p[materiaId] }))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
      <Button onClick={onCriar} disabled={loading} className="w-full gap-2 text-xs font-bold py-2 px-3 rounded-xl h-9">
        <Plus className="w-4 h-4" />
        Nova conversa
      </Button>

      <div className="space-y-3">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 px-1">Geral</h4>
          <div className="space-y-1">
            {conversas.geral.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 px-1 py-1 italic">Nenhuma conversa geral.</p>
            ) : (
              conversas.geral.map(c => (
                <ItemConversaIA
                  key={c.id}
                  conversa={c}
                  conversaAtiva={conversaAtiva}
                  onSelecionar={onSelecionar}
                  onExcluir={onExcluir}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Por Disciplina</h4>
          <div className="space-y-2">
            {conversas.disciplinas.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 px-1 py-1 italic">Nenhum chat de disciplinas.</p>
            ) : (
              conversas.disciplinas.map(d => {
                const isExpanded = !!expandedMaterias[d.materia_id]
                return (
                  <div key={d.materia_id} className="border border-border rounded-xl overflow-hidden bg-card/50">
                    <div
                      onClick={() => alternarMateria(d.materia_id)}
                      className="flex items-center justify-between p-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Folder className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                        <span className="text-[11px] font-bold text-foreground truncate">{d.codigo} - {d.nome}</span>
                      </div>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="p-2 border-t border-border bg-muted/10 space-y-1">
                        {d.chats.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground/60 px-1 py-1.5 italic">Nenhuma conversa nesta disciplina.</p>
                        ) : (
                          d.chats.map(c => (
                            <ItemConversaIA
                              key={c.id}
                              conversa={c}
                              conversaAtiva={conversaAtiva}
                              onSelecionar={onSelecionar}
                              onExcluir={onExcluir}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

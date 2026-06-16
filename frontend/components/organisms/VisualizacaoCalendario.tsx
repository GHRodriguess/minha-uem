'use client'

import { useState } from 'react'
import { Avaliacao, Materia } from '@/types/academico'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileEdit } from 'lucide-react'

interface VisualizacaoCalendarioProps {
  avaliacoes: (Avaliacao & { materia: Materia })[]
  onEdit: (a: Avaliacao, materiaId: number) => void
}

export default function VisualizacaoCalendario({ avaliacoes, onEdit }: VisualizacaoCalendarioProps) {
  const [dataFoco, setDataFoco] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)

  const ano = dataFoco.getFullYear()
  const mes = dataFoco.getMonth()
  const primeiroDiaMes = new Date(ano, mes, 1).getDay()
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate()

  const dias = Array.from({ length: totalDiasMes }, (_, i) => i + 1)
  const vazios = Array.from({ length: primeiroDiaMes }, (_, i) => i)

  const mudarMes = (direcao: number) => {
    setDataFoco(new Date(ano, mes + direcao, 1))
    setDiaSelecionado(null)
  }

  const obterTarefasDoDia = (dia: number) => {
    const dStr = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`
    return avaliacoes.filter((a) => a.data === dStr)
  }

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const tarefasSelecionadas = diaSelecionado ? obterTarefasDoDia(diaSelecionado) : []

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
            {nomesMeses[mes]} {ano}
          </h3>
          <div className="flex gap-2">
            <button onClick={() => mudarMes(-1)} className="p-2 hover:bg-muted border border-border rounded-xl text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => mudarMes(1)} className="p-2 hover:bg-muted border border-border rounded-xl text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-black text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {vazios.map(v => <div key={`v-${v}`} className="aspect-square bg-muted/5 rounded-xl sm:rounded-2xl border border-dashed border-border/20" />)}
          {dias.map((dia) => {
            const tarefas = obterTarefasDoDia(dia)
            const sel = diaSelecionado === dia
            return (
              <button
                key={`d-${dia}`}
                onClick={() => setDiaSelecionado(dia)}
                className={`aspect-square p-1 sm:p-2 border rounded-xl sm:rounded-2xl flex flex-col justify-between hover:bg-muted/10 transition-colors text-left ${
                  tarefas.length > 0 ? 'bg-primary/5 border-primary/20' : 'border-border/50'
                } ${sel ? 'ring-2 ring-primary border-primary bg-primary/10' : ''}`}
              >
                <span className={`text-[10px] font-bold ${tarefas.length > 0 ? 'text-primary font-black' : 'text-muted-foreground'}`}>{dia}</span>
                
                <div className="hidden md:flex flex-col gap-1 w-full overflow-y-auto max-h-[70%]">
                  {tarefas.slice(0, 2).map(t => (
                    <div key={t.id} onClick={(e) => { e.stopPropagation(); onEdit(t, t.materia.id) }} title={`${t.materia.nome}: ${t.nome}`} className="text-[7px] font-black uppercase whitespace-normal wrap-break-word bg-primary/15 text-primary px-1 py-0.5 rounded cursor-pointer hover:bg-primary/25">
                      {t.materia.nome}: {t.nome}
                    </div>
                  ))}
                  {tarefas.length > 2 && <span className="text-[7px] font-black text-muted-foreground text-center">+{tarefas.length - 2}</span>}
                </div>

                <div className="flex md:hidden gap-0.5 justify-center mt-1 w-full">
                  {tarefas.slice(0, 3).map(t => (
                    <span key={t.id} className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.tipo === 'PROVA' ? 'bg-red-500' : 'bg-primary'}`} />
                  ))}
                  {tarefas.length > 3 && <span className="text-[6px] font-bold text-muted-foreground leading-none">+</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {diaSelecionado && tarefasSelecionadas.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 animate-fade-in">
          <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Tarefas do Dia {diaSelecionado}/{mes + 1}/{ano}
          </h4>
          <div className="flex flex-col gap-3">
            {tarefasSelecionadas.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-muted/20 border border-border/50 rounded-2xl">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase">{t.materia.nome}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{t.nome}</p>
                  <div className="flex gap-2 text-[9px] text-muted-foreground font-semibold uppercase mt-1">
                    <span>{t.tipo}</span>
                    <span>•</span>
                    <span>Peso: {t.peso}</span>
                    {t.nota !== null && <><span>•</span><span className="text-green-500 font-bold">Nota: {t.nota}</span></>}
                  </div>
                </div>
                <button onClick={() => onEdit(t, t.materia.id)} className="p-2 hover:bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"><FileEdit className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { Materia } from '@/types/academico'

interface FiltrosTarefasProps {
  materias: Materia[]
  materiaSelecionada: string
  setMateriaSelecionada: (val: string) => void
  tipoSelecionado: string
  setTipoSelecionado: (val: string) => void
}

export default function FiltrosTarefas({
  materias,
  materiaSelecionada,
  setMateriaSelecionada,
  tipoSelecionado,
  setTipoSelecionado
}: FiltrosTarefasProps) {
  const tipos = [
    { value: 'TODOS', label: 'Todos os tipos' },
    { value: 'PROVA', label: 'Provas' },
    { value: 'TRABALHO', label: 'Trabalhos' },
    { value: 'EXAME', label: 'Exames' },
    { value: 'TAREFA', label: 'Tarefas' },
    { value: 'PESQUISA', label: 'Pesquisas' },
    { value: 'OUTRO', label: 'Outros' }
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div className="flex flex-col gap-1 w-full sm:w-64">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Disciplina
          </label>
          <select
            value={materiaSelecionada}
            onChange={(e) => setMateriaSelecionada(e.target.value)}
            className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="TODAS">Todas as disciplinas</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id.toString()}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Tipo
          </label>
          <select
            value={tipoSelecionado}
            onChange={(e) => setTipoSelecionado(e.target.value)}
            className="w-full h-10 px-3 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {tipos.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

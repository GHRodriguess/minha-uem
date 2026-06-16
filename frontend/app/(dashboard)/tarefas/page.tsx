'use client'

import { useGerenciadorTarefas } from './useGerenciadorTarefas'
import FiltrosTarefas from '@/components/molecules/FiltrosTarefas'
import VisualizacaoKanban from '@/components/organisms/VisualizacaoKanban'
import VisualizacaoLista from '@/components/organisms/VisualizacaoLista'
import VisualizacaoCalendario from '@/components/organisms/VisualizacaoCalendario'
import ModalEditarTarefa from '@/components/organisms/ModalEditarTarefa'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List, Calendar as CalendarIcon } from 'lucide-react'
import { Suspense } from 'react'

function ConteudoPaginaTarefas() {
  const {
    materias, materiaSelecionada, setMateriaSelecionada, tipoSelecionado, setTipoSelecionado,
    abaAtiva, setAbaAtiva, modalAberto, setModalAberto, tarefaSelecionada, materiaPadraoId,
    statusPadrao, tarefasFiltradas, handleStatusChange, handleSave, handleDelete, abrirNovo, abrirEdicao
  } = useGerenciadorTarefas()

  const abas = [
    { id: 'kanban' as const, label: 'Kanban', icon: LayoutGrid },
    { id: 'lista' as const, label: 'Lista', icon: List },
    { id: 'calendario' as const, label: 'Calendário', icon: CalendarIcon }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Painel de Tarefas</h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Gerencie e organize suas avaliações, prazos e trabalhos</p>
        </div>
        <Button onClick={() => abrirNovo('A_FAZER')} className="h-11 px-6 rounded-xl font-bold flex items-center gap-2 uppercase tracking-wider text-xs">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      <FiltrosTarefas
        materias={materias}
        materiaSelecionada={materiaSelecionada}
        setMateriaSelecionada={setMateriaSelecionada}
        tipoSelecionado={tipoSelecionado}
        setTipoSelecionado={setTipoSelecionado}
      />

      <div className="flex border-b border-border/60 gap-4">
        {abas.map((aba) => {
          const Icone = aba.icon
          const ativa = abaAtiva === aba.id
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 -mb-0.5 ${
                ativa ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icone className="w-4 h-4" />
              {aba.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        {abaAtiva === 'kanban' && (
          <VisualizacaoKanban
            avaliacoes={tarefasFiltradas}
            onEdit={abrirEdicao}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onAdd={abrirNovo}
          />
        )}
        {abaAtiva === 'lista' && (
          <VisualizacaoLista
            avaliacoes={tarefasFiltradas}
            onEdit={abrirEdicao}
            onDelete={handleDelete}
          />
        )}
        {abaAtiva === 'calendario' && (
          <VisualizacaoCalendario
            avaliacoes={tarefasFiltradas}
            onEdit={abrirEdicao}
          />
        )}
      </div>

      {modalAberto && (
        <ModalEditarTarefa
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          onSave={handleSave}
          materias={materias}
          materiaPadraoId={materiaPadraoId}
          avaliacao={tarefaSelecionada}
          statusPadrao={statusPadrao}
        />
      )}
    </div>
  )
}

export default function PaginaTarefas() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs font-semibold text-muted-foreground">Carregando tarefas...</div>}>
      <ConteudoPaginaTarefas />
    </Suspense>
  )
}

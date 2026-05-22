'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Materia, ConfiguracaoMateria, Avaliacao } from '@/types/academico'
import { academic_service } from '@/lib/api/academico'
import { ItemAvaliacao } from '../molecules/ItemAvaliacao'
import { Button } from '../ui/button'
import { Plus, Calculator, Target, AlertCircle, Loader2, Info } from 'lucide-react'
import { InputNota } from '../atoms/InputNota'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface CardGestaoNotasProps {
  materia: Materia
  anoId: number
}

export function CardGestaoNotas({ materia, anoId }: CardGestaoNotasProps) {
  const { data: session } = useSession()
  const [config, setConfig] = useState<ConfiguracaoMateria | null>(materia.configuracao_notas || null)
  const [loading, setLoading] = useState(!materia.configuracao_notas)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (!materia.configuracao_notas && session?.accessToken) {
      buscarConfiguracao()
    }
  }, [materia.id, anoId, session])

  async function buscarConfiguracao() {
    if (!session?.accessToken) return
    setLoading(true)
    try {
      const data = await academic_service.obterConfiguracaoNotas(session.accessToken, materia.id, anoId)
      setConfig(data)
    } catch (error) {
      console.error('Erro ao buscar configuração de notas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id && config) {
      const oldIndex = config.avaliacoes.findIndex((a) => a.id === active.id)
      const newIndex = config.avaliacoes.findIndex((a) => a.id === over.id)

      const novasAvaliacoes = arrayMove(config.avaliacoes, oldIndex, newIndex)
      
      setConfig({ ...config, avaliacoes: novasAvaliacoes })

      if (session?.accessToken) {
        try {
          await Promise.all(
            novasAvaliacoes.map((a, index) => 
              academic_service.atualizarAvaliacao(session.accessToken!, a.id, { ordem: index })
            )
          )
        } catch (error) {
          console.error('Erro ao salvar nova ordem:', error)
          buscarConfiguracao()
        }
      }
    }
  }

  async function adicionarAvaliacao(tipo: 'PROVA' | 'TAREFA' = 'PROVA') {
    if (!session?.accessToken || !config) return
    try {
      const nomePadrao = tipo === 'PROVA' 
        ? `Avaliação ${config.avaliacoes.filter(a => ['PROVA', 'EXAME', 'OUTRO'].includes(a.tipo)).length + 1}`
        : `Tarefa ${config.avaliacoes.filter(a => ['TRABALHO', 'TAREFA', 'PESQUISA'].includes(a.tipo)).length + 1}`

      const nova = await academic_service.criarAvaliacao(session.accessToken, config.id, {
        nome: nomePadrao,
        peso: 1,
        tipo: tipo,
        ordem: config.avaliacoes.length
      })
      setConfig({
        ...config,
        avaliacoes: [...config.avaliacoes, nova]
      })
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error)
    }
  }

  async function atualizarAvaliacao(id: number, data: Partial<Avaliacao>) {
    if (!session?.accessToken || !config) return
    try {
      const atualizada = await academic_service.atualizarAvaliacao(session.accessToken, id, data)
      setConfig(prev => {
        if (!prev) return null
        const novasAvaliacoes = prev.avaliacoes.map(a => a.id === id ? { ...a, ...atualizada } : a)
        return { ...prev, avaliacoes: novasAvaliacoes }
      })
      
      const configAtualizada = await academic_service.obterConfiguracaoNotas(session.accessToken, materia.id, anoId)
      setConfig(configAtualizada)
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error)
    }
  }

  async function excluirAvaliacao(id: number) {
    if (!session?.accessToken || !config) return
    try {
      await academic_service.excluirAvaliacao(session.accessToken, id)
      const configAtualizada = await academic_service.obterConfiguracaoNotas(session.accessToken, materia.id, anoId)
      setConfig(configAtualizada)
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error)
    }
  }

  async function atualizarMediaMinima(val: number | null) {
    if (!session?.accessToken || !config || val === null) return
    try {
      const atualizada = await academic_service.atualizarConfiguracaoNotas(session.accessToken, materia.id, anoId, {
        media_minima: val
      })
      setConfig(atualizada)
    } catch (error) {
      console.error('Erro ao atualizar média mínima:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!config) return null

  const todasNotas = config.avaliacoes.every(a => a.nota !== null) && config.avaliacoes.length > 0
  const aprovado = config.media_atual >= config.media_minima
  const avaliacoesFiltradas = config.avaliacoes.filter(a => ['PROVA', 'EXAME', 'OUTRO'].includes(a.tipo))
  const entregasFiltradas = config.avaliacoes.filter(a => ['TRABALHO', 'TAREFA', 'PESQUISA'].includes(a.tipo))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Média Atual</p>
            <p className="text-2xl font-black text-foreground">{config.media_atual.toFixed(2)}</p>
          </div>
        </div>

        <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
          todasNotas 
            ? (aprovado ? 'bg-green-500/5 border-green-500/10' : 'bg-destructive/5 border-destructive/10')
            : 'bg-muted/5 border-border'
        }`}>
          <div className={`p-3 rounded-xl ${
            todasNotas 
              ? (aprovado ? 'bg-green-500/10' : 'bg-destructive/10')
              : 'bg-muted'
          }`}>
            <Target className={`w-6 h-6 ${
              todasNotas 
                ? (aprovado ? 'text-green-500' : 'text-destructive')
                : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">
              {todasNotas ? 'Status Final' : 'Precisa Tirar'}
            </p>
            <p className={`text-2xl font-black ${
              todasNotas 
                ? (aprovado ? 'text-green-500' : 'text-destructive')
                : 'text-foreground'
            }`}>
              {todasNotas 
                ? (aprovado ? 'Aprovado' : 'Reprovado')
                : config.quanto_falta.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Avaliações e Provas</h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => adicionarAvaliacao('PROVA')}
            className="h-8 gap-2 font-bold text-xs border-dashed"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {avaliacoesFiltradas.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-border rounded-2xl">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-20" />
              <p className="text-xs text-muted-foreground font-semibold">Nenhuma avaliação cadastrada.</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={avaliacoesFiltradas.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {avaliacoesFiltradas.map(avaliacao => (
                    <ItemAvaliacao
                      key={avaliacao.id}
                      avaliacao={avaliacao}
                      onUpdate={atualizarAvaliacao}
                      onDelete={excluirAvaliacao}
                      groupType="PROVA"
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-border/50">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Trabalhos, Tarefas e Pesquisas</h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => adicionarAvaliacao('TAREFA')}
            className="h-8 gap-2 font-bold text-xs border-dashed"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {entregasFiltradas.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-border rounded-2xl">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-20" />
              <p className="text-xs text-muted-foreground font-semibold">Nenhum trabalho ou tarefa cadastrado.</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={entregasFiltradas.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {entregasFiltradas.map(avaliacao => (
                    <ItemAvaliacao
                      key={avaliacao.id}
                      avaliacao={avaliacao}
                      onUpdate={atualizarAvaliacao}
                      onDelete={excluirAvaliacao}
                      groupType="ENTREGA"
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 bg-muted/20 p-3 rounded-xl border border-border/50">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Peso 0 significa que a tarefa não vale nota.</span>
        </div>
      </div>
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          Média mínima para aprovação:
        </div>
        <InputNota
          value={config.media_minima}
          onChange={atualizarMediaMinima}
          className="h-8 w-16 text-sm"
        />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { academic_service } from '@/lib/api/academico'
import { Avaliacao } from '@/types/academico'
import { useSearchParams } from 'next/navigation'

export function useGerenciadorTarefas() {
  const { data: session } = useSession()
  const { perfil, setPerfil } = useAcademico()
  const searchParams = useSearchParams()
  const [materiaSelecionada, setMateriaSelecionada] = useState('TODAS')
  const [tipoSelecionado, setTipoSelecionado] = useState('TODOS')
  const [abaAtiva, setAbaAtiva] = useState<'kanban' | 'lista' | 'calendario'>('kanban')
  const [modalAberto, setModalAberto] = useState(false)
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Avaliacao | null>(null)
  const [materiaPadraoId, setMateriaPadraoId] = useState<number | undefined>(undefined)
  const [statusPadrao, setStatusPadrao] = useState<'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO'>('A_FAZER')

  useEffect(() => {
    const matId = searchParams.get('materiaId')
    if (matId) setMateriaSelecionada(matId)
  }, [searchParams])

  const materias = perfil?.materias || []
  const obterTarefasComMateria = () => materias.flatMap(m => (m.configuracao_notas?.avaliacoes || []).map(a => ({ ...a, materia: m })))

  const tarefasFiltradas = obterTarefasComMateria().filter(a => {
    const m = materiaSelecionada === 'TODAS' || a.materia.id.toString() === materiaSelecionada
    const t = tipoSelecionado === 'TODOS' || a.tipo === tipoSelecionado
    return m && t
  })

  const atualizarLocalmente = (materiaId: number, item: Avaliacao, acao: 'CRIAR' | 'EDITAR' | 'EXCLUIR') => {
    if (!perfil) return
    const novas = (perfil.materias || []).map(m => {
      if (m.id !== materiaId) return m
      const config = m.configuracao_notas
      if (!config) return m
      let avs = [...config.avaliacoes]
      if (acao === 'CRIAR') avs.push(item)
      else if (acao === 'EDITAR') avs = avs.map(a => a.id === item.id ? item : a)
      else if (acao === 'EXCLUIR') avs = avs.filter(a => a.id !== item.id)
      return { ...m, configuracao_notas: { ...config, avaliacoes: avs } }
    })
    setPerfil({ ...perfil, materias: novas })
  }

  const handleStatusChange = async (id: number, status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO') => {
    if (!session?.accessToken) return
    const t = obterTarefasComMateria().find(x => x.id === id)
    if (!t) return
    const att = { ...t, status }
    atualizarLocalmente(t.materia.id, att, 'EDITAR')
    try { await academic_service.atualizarAvaliacao(session.accessToken, id, { status }) }
    catch { atualizarLocalmente(t.materia.id, t, 'EDITAR') }
  }

  const handleSave = async (materiaId: number, data: Partial<Avaliacao> & { id?: number }) => {
    if (!session?.accessToken) return
    if (data.id) {
      const antiga = obterTarefasComMateria().find(t => t.id === data.id)
      if (!antiga) return
      atualizarLocalmente(materiaId, { ...antiga, ...data } as Avaliacao, 'EDITAR')
      try {
        const res = await academic_service.atualizarAvaliacao(session.accessToken, data.id, data)
        atualizarLocalmente(materiaId, res, 'EDITAR')
      } catch { atualizarLocalmente(materiaId, antiga, 'EDITAR') }
    } else {
      const config = materias.find(m => m.id === materiaId)?.configuracao_notas
      if (!config) return
      try {
        const res = await academic_service.criarAvaliacao(session.accessToken, config.id, data)
        atualizarLocalmente(materiaId, res, 'CRIAR')
      } catch {}
    }
    setModalAberto(false)
  }

  const handleDelete = async (id: number) => {
    if (!session?.accessToken) return
    const t = obterTarefasComMateria().find(x => x.id === id)
    if (!t) return
    atualizarLocalmente(t.materia.id, t, 'EXCLUIR')
    try { await academic_service.excluirAvaliacao(session.accessToken, id) }
    catch { atualizarLocalmente(t.materia.id, t, 'CRIAR') }
  }

  const abrirNovo = (s: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO' = 'A_FAZER') => {
    setTarefaSelecionada(null)
    setStatusPadrao(s)
    setMateriaPadraoId(materiaSelecionada !== 'TODAS' ? parseInt(materiaSelecionada) : undefined)
    setModalAberto(true)
  }

  const abrirEdicao = (a: Avaliacao, materiaId: number) => {
    setTarefaSelecionada(a)
    setMateriaPadraoId(materiaId)
    setModalAberto(true)
  }

  return {
    materias, materiaSelecionada, setMateriaSelecionada, tipoSelecionado, setTipoSelecionado,
    abaAtiva, setAbaAtiva, modalAberto, setModalAberto, tarefaSelecionada, materiaPadraoId,
    statusPadrao, tarefasFiltradas, handleStatusChange, handleSave, handleDelete, abrirNovo, abrirEdicao
  }
}

'use client'

import { useState } from 'react'
import { Avaliacao, Materia } from '@/types/academico'
import { Button } from '../ui/button'

interface FormTarefaProps {
  avaliacao?: Avaliacao | null
  tipoPadrao?: Avaliacao['tipo']
  materias: Materia[]
  materiaPadraoId?: number
  statusPadrao: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  onSave: (materiaId: number, data: Partial<Avaliacao> & { id?: number }) => Promise<void>
  onCancel: () => void
}

const obter_rotulo_data = (t: Avaliacao['tipo']) => {
  if (t === 'PROVA') return 'Data da Prova'
  if (t === 'TRABALHO' || t === 'PESQUISA') return 'Data de Entrega'
  if (t === 'EXAME') return 'Data do Exame'
  return 'Data Limite'
}

const obter_nome_padrao = (t: Avaliacao['tipo']) => {
  if (t === 'PROVA') return 'Avaliação '
  if (t === 'TRABALHO') return 'Trabalho - '
  if (t === 'EXAME') return 'Exame Final'
  if (t === 'TAREFA') return 'Tarefa - '
  if (t === 'PESQUISA') return 'Pesquisa - '
  return ''
}

export default function FormTarefa({
  avaliacao, tipoPadrao, materias, materiaPadraoId, statusPadrao, onSave, onCancel
}: FormTarefaProps) {
  const initial_tipo = avaliacao?.tipo || tipoPadrao || 'TAREFA'
  const [tipo, setTipo] = useState<Avaliacao['tipo']>(initial_tipo)
  const [nome, setNome] = useState(avaliacao?.nome || (tipoPadrao ? obter_nome_padrao(tipoPadrao) : ''))
  const [data, setData] = useState(avaliacao?.data || '')
  const [peso, setPeso] = useState(avaliacao ? avaliacao.peso.toString() : '1')
  const [nota, setNota] = useState(avaliacao && avaliacao.nota !== null ? avaliacao.nota.toString() : '')
  const [status, setStatus] = useState(avaliacao?.status || statusPadrao)
  const [materiaId, setMateriaId] = useState(avaliacao ? (materiaPadraoId ? materiaPadraoId.toString() : '') : (materiaPadraoId ? materiaPadraoId.toString() : materias[0]?.id.toString() || ''))
  const [submitting, setSubmitting] = useState(false)

  const alterar_tipo = (novo_tipo: Avaliacao['tipo']) => {
    setTipo(novo_tipo)
    if (!avaliacao) setNome(obter_nome_padrao(novo_tipo))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materiaId || submitting) return
    setSubmitting(true)
    try {
      await onSave(parseInt(materiaId), {
        id: avaliacao?.id, nome, tipo, data: data || null,
        peso: parseFloat(peso) || 0, nota: nota !== '' ? parseFloat(nota) : null, status
      })
    } catch {} finally { setSubmitting(false) }
  }

  const selectClass = "w-full h-10 px-3 bg-background border border-border rounded-xl text-foreground font-bold focus:outline-none"
  const inputClass = "w-full h-10 px-3 bg-background border border-border rounded-xl text-foreground font-bold focus:outline-none"

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 text-xs">
      <div className="flex flex-col gap-1">
        <label className="font-black text-muted-foreground uppercase">Nome da Tarefa</label>
        <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-black text-muted-foreground uppercase">Disciplina</label>
          <select disabled={!!avaliacao} value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className={selectClass}>
            {materias.map((m) => <option key={m.id} value={m.id.toString()}>{m.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-black text-muted-foreground uppercase">Tipo</label>
          <select value={tipo} onChange={(e) => alterar_tipo(e.target.value as Avaliacao['tipo'])} className={selectClass}>
            {['PROVA', 'TRABALHO', 'EXAME', 'TAREFA', 'PESQUISA', 'OUTRO'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-black text-muted-foreground uppercase">{obter_rotulo_data(tipo)}</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-black text-muted-foreground uppercase">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectClass}>
            <option value="A_FAZER">A Fazer</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDO">Concluído</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-black text-muted-foreground uppercase">Peso</label>
          <input type="number" step="0.01" required value={peso} onChange={(e) => setPeso(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-black text-muted-foreground uppercase">Nota</label>
          <input type="number" step="0.01" value={nota} placeholder="Sem nota" onChange={(e) => setNota(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-bold">Cancelar</Button>
        <Button type="submit" disabled={submitting} className="rounded-xl font-bold">{submitting ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  )
}

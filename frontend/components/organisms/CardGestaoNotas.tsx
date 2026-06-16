'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Materia, ConfiguracaoMateria, Avaliacao } from '@/types/academico'
import { academic_service } from '@/lib/api/academico'
import { Calculator, Target, ExternalLink } from 'lucide-react'
import { InputNota } from '../atoms/InputNota'
import Link from 'next/link'

interface CardGestaoNotasProps {
  materia: Materia
  anoId: number
}

export function CardGestaoNotas({ materia, anoId }: CardGestaoNotasProps) {
  const { data: session } = useSession()
  const [config, setConfig] = useState<ConfiguracaoMateria | null>(materia.configuracao_notas || null)

  const atualizarAvaliacao = async (id: number, data: Partial<Avaliacao>) => {
    if (!session?.accessToken || !config) return
    try {
      const att = await academic_service.atualizarAvaliacao(session.accessToken, id, data)
      const avs = config.avaliacoes.map(a => a.id === id ? { ...a, ...att } : a)
      const novaConfig = await academic_service.obterConfiguracaoNotas(session.accessToken, materia.id, anoId)
      setConfig({ ...novaConfig, avaliacoes: avs })
    } catch (err) {
      console.error(err)
    }
  }

  const atualizarMediaMinima = async (val: number | null) => {
    if (!session?.accessToken || !config || val === null) return
    try {
      const att = await academic_service.atualizarConfiguracaoNotas(session.accessToken, materia.id, anoId, { media_minima: val })
      setConfig(att)
    } catch (err) {
      console.error(err)
    }
  }

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return ''
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  if (!config) return null
  const todasNotas = config.avaliacoes.every(a => a.nota !== null) && config.avaliacoes.length > 0
  const aprovado = config.media_atual >= config.media_minima

  return (
    <div className="space-y-6 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3">
          <Calculator className="w-5 h-5 text-primary" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Média Atual</p>
            <p className="text-xl font-black text-foreground">{config.media_atual.toFixed(2)}</p>
          </div>
        </div>
        <div className={`border rounded-2xl p-4 flex items-center gap-3 ${todasNotas ? (aprovado ? 'bg-green-500/5 border-green-500/10' : 'bg-destructive/5 border-destructive/10') : 'bg-muted/5 border-border'}`}>
          <Target className={`w-5 h-5 ${todasNotas ? (aprovado ? 'text-green-500' : 'text-destructive') : 'text-muted-foreground'}`} />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{todasNotas ? 'Status Final' : 'Precisa Tirar'}</p>
            <p className={`text-xl font-black ${todasNotas ? (aprovado ? 'text-green-500' : 'text-destructive') : 'text-foreground'}`}>{todasNotas ? (aprovado ? 'Aprovado' : 'Reprovado') : config.quanto_falta.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-muted/10 text-[9px] sm:text-[10px]">
              <th className="px-2.5 py-3 sm:p-3 font-black text-muted-foreground uppercase">Avaliação</th>
              <th className="px-2.5 py-3 sm:p-3 font-black text-muted-foreground uppercase w-14 sm:w-20">Peso</th>
              <th className="px-2.5 py-3 sm:p-3 font-black text-muted-foreground uppercase w-16 sm:w-24">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {config.avaliacoes.map((item) => (
              <tr key={item.id} className="hover:bg-muted/5">
                <td className="px-2.5 py-3 sm:p-3">
                  <p className="font-bold text-foreground">{item.nome}</p>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground uppercase mt-0.5">
                    <span>{item.tipo}</span>
                    {item.data && (
                      <>
                        <span>•</span>
                        <span>{formatarData(item.data)}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-2.5 py-3 sm:p-3">
                  <InputNota value={item.peso} onChange={(val) => atualizarAvaliacao(item.id, { peso: val || 0 })} className="h-7 w-12 sm:w-16 font-bold" />
                </td>
                <td className="px-2.5 py-3 sm:p-3">
                  <InputNota value={item.nota} onChange={(val) => atualizarAvaliacao(item.id, { nota: val })} className="h-7 w-14 sm:w-20 font-bold" placeholder="-" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          Média mínima:
          <InputNota value={config.media_minima} onChange={atualizarMediaMinima} className="h-7 w-14 sm:w-16 text-center font-bold" />
        </div>
        <Link href={`/tarefas?materiaId=${materia.id}`} className="flex items-center gap-1.5 text-primary hover:underline font-bold uppercase tracking-wider text-[10px]">
          Gerenciar Prazos e Kanban
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

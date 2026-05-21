'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia } from '@/types/academico'
import { BookOpen, AlertTriangle, CheckCircle2, Loader2, CalendarDays, LayoutGrid, ListFilter, SortAsc, SortDesc } from 'lucide-react'
import Link from 'next/link'
import { useAcademico } from '@/components/providers/ProvedorAcademico'

type Ordenacao = 'nome' | 'faltas'
type Agrupamento = 'nenhum' | 'departamento'

export default function DisciplinasPage() {
  const { data: session } = useSession()
  const { anoAtivoId, versao } = useAcademico()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('faltas')
  const [agrupamento, setAgrupamento] = useState<Agrupamento>('nenhum')

  const buscarPerfil = useCallback(async () => {
    if (!session?.accessToken) return

    setLoading(true)
    try {
      const data = await academic_service.obterPerfil(session.accessToken, anoAtivoId || undefined)
      setPerfil(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }, [session, anoAtivoId])

  useEffect(() => {
    buscarPerfil()
  }, [buscarPerfil, versao])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando disciplinas...</p>
      </div>
    )
  }

  if (!perfil?.materias || perfil.materias.length === 0) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Nenhuma disciplina encontrada</h2>
        <p className="text-muted-foreground mt-2">Faça o upload do seu PDF na página inicial para começar.</p>
      </div>
    )
  }

  // Lógica de Processamento (Ordenação e Agrupamento)
  const materiasProcessadas = [...perfil.materias].sort((a, b) => {
    if (ordenacao === 'nome') {
      return a.nome.localeCompare(b.nome)
    } else {
      return b.faltas_atuais - a.faltas_atuais
    }
  })

  const renderizarGrade = (materias: Materia[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {materias.map((materia: Materia) => {
        const primeiroHorario = materia.horarios?.[0]
        if (!primeiroHorario) return null

        const maxFaltas = primeiroHorario.maximo_faltas
        const porcentagemFaltas = (materia.faltas_atuais / maxFaltas) * 100
        const noLimite = porcentagemFaltas >= 80
        const reprovado = materia.faltas_atuais > maxFaltas

        return (
          <Link 
            key={materia.id} 
            href={`/disciplinas/${materia.id}`}
            className="group bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{materia.nome}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {materia.codigo} • Turma {primeiroHorario.turma}
                  </p>
                </div>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                  {primeiroHorario.departamento}
                </span>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Faltas</p>
                    <p className="text-3xl font-black text-foreground">
                      {materia.faltas_atuais} <span className="text-sm font-normal text-muted-foreground">/ {maxFaltas}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                    Ver detalhes
                    <BookOpen className="w-3 h-3" />
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      reprovado ? 'bg-destructive' : noLimite ? 'bg-yellow-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(porcentagemFaltas, 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {reprovado ? (
                    <div className="flex items-center gap-1.5 text-destructive font-bold text-xs uppercase">
                      <AlertTriangle className="w-4 h-4" />
                      Reprovado por faltas
                    </div>
                  ) : noLimite ? (
                    <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-xs uppercase">
                      <AlertTriangle className="w-4 h-4" />
                      Atenção ao limite de faltas
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs uppercase">
                      <CheckCircle2 className="w-4 h-4" />
                      Frequência regular
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              <span>Início: {new Date(primeiroHorario.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              <span>Término: {new Date(primeiroHorario.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )

  const departamentos = Array.from(new Set(materiasProcessadas.map(m => m.horarios?.[0]?.departamento).filter(Boolean)))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Minhas Disciplinas</h2>
          <p className="text-muted-foreground mt-1 font-medium">Gerencie suas notas, faltas e materiais de estudo</p>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border">
          <div className="flex items-center gap-1.5 px-3">
            <ListFilter className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Visualização:</span>
          </div>
          
          <select 
            value={agrupamento}
            onChange={(e) => setAgrupamento(e.target.value as Agrupamento)}
            className="bg-background border border-border rounded-xl px-3 h-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="nenhum">Sem Agrupamento</option>
            <option value="departamento">Por Departamento</option>
          </select>

          <select 
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="bg-background border border-border rounded-xl px-3 h-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="nome">Nome (A-Z)</option>
            <option value="faltas">Mais Faltas</option>
          </select>
        </div>
      </section>

      {agrupamento === 'departamento' ? (
        <div className="space-y-12">
          {departamentos.map(depto => {
            const materiasDepto = materiasProcessadas.filter(m => m.horarios?.[0]?.departamento === depto)
            return (
              <div key={depto} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {depto}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {materiasDepto.length} {materiasDepto.length === 1 ? 'materia' : 'materias'}
                  </span>
                </div>
                {renderizarGrade(materiasDepto)}
              </div>
            )
          })}
        </div>
      ) : (
        renderizarGrade(materiasProcessadas)
      )}
    </div>
  )
}

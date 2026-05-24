'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, use } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Materia } from '@/types/academico'
import { AlertTriangle, ArrowLeft, GraduationCap, FileText } from 'lucide-react'
import Link from 'next/link'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import CarregamentoDetalheDisciplina from '@/components/templates/CarregamentoDetalheDisciplina'
import { CardGestaoNotas } from '@/components/organisms/CardGestaoNotas'
import { CardClassroom } from '@/components/organisms/CardClassroom'
import MuralClassroom from '@/components/organisms/MuralClassroom'
import { CardFrequenciaDisciplina } from '@/components/organisms/CardFrequenciaDisciplina'
import { CardHorariosDisciplina } from '@/components/organisms/CardHorariosDisciplina'
import { CardPrazosDisciplina } from '@/components/organisms/CardPrazosDisciplina'
import { CardAnotacoesMateria } from '@/components/organisms/CardAnotacoesMateria'

interface PaginaDisciplinaProps {
  params: Promise<{ id: string }>
}

export default function PaginaDisciplina({ params }: PaginaDisciplinaProps) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { anoAtivoId } = useAcademico()
  const [materia, setMateria] = useState<Materia | null>(null)
  const [loading, setLoading] = useState(true)
  const { preCarregarArquivos, filesCache } = useClassroom()

  const buscarDados = useCallback(async (silencioso = false) => {
    if (!session?.accessToken || !anoAtivoId) return

    if (!silencioso) {
      setLoading(true)
    }
    try {
      const encontrada = await academic_service.obterMateria(session.accessToken, parseInt(id), anoAtivoId)
      if (encontrada) {
        setMateria(encontrada)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da disciplina:', error)
    } finally {
      if (!silencioso) {
        setLoading(false)
      }
    }
  }, [session, anoAtivoId, id])

  useEffect(() => {
    buscarDados()
  }, [buscarDados])

  useEffect(() => {
    if (anoAtivoId) {
      preCarregarArquivos(parseInt(id), anoAtivoId)
    }
  }, [id, anoAtivoId, preCarregarArquivos])

  if (loading) {
    return <CarregamentoDetalheDisciplina />
  }

  if (!materia) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive opacity-20" />
        <h2 className="text-2xl font-bold">Disciplina não encontrada</h2>
        <Link href="/disciplinas" className="text-primary hover:underline mt-4 inline-block font-bold">
          Voltar para lista
        </Link>
      </div>
    )
  }

  const primeiroHorario = materia.horarios?.[0]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <section className="flex flex-col gap-4">
        <Link 
          href="/disciplinas" 
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Disciplinas
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                {primeiroHorario?.departamento}
              </span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {materia.codigo} • Turma {primeiroHorario?.turma}
              </span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">{materia.nome}</h1>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gestão de Notas</h2>
                    <p className="text-xs text-muted-foreground font-medium">Configure seus pesos e acompanhe sua média</p>
                  </div>
                </div>
                <CardGestaoNotas materia={materia} anoId={anoAtivoId || 0} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <CardPrazosDisciplina materia={materia} />
            <CardFrequenciaDisciplina 
              materia={materia} 
              anoId={anoAtivoId || 0} 
              onUpdate={() => buscarDados(true)} 
            />
            <CardHorariosDisciplina materia={materia} />
          </div>
        </div>

        <CardAnotacoesMateria materia={materia} />

        {filesCache[materia.id]?.vinculado ? (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Materiais de Estudo</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {filesCache[materia.id]?.arquivos?.length > 0
                    ? `${filesCache[materia.id].arquivos.length} arquivos e documentos sincronizados do Google Classroom`
                    : 'Gerencie e visualize os arquivos integrados do Google Classroom'}
                </p>
              </div>
            </div>
            <Link 
              href={`/disciplinas/${materia.id}/arquivos`}
              className="h-11 px-6 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-sm shrink-0 uppercase tracking-wider"
            >
              Visualizar Arquivos
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Materiais de Estudo</h2>
                <p className="text-xs text-muted-foreground font-medium">Arquivos e documentos sincronizados do Google Classroom</p>
              </div>
            </div>
            <CardClassroom materiaId={materia.id} anoId={anoAtivoId || 0} />
          </div>
        )}

        <MuralClassroom materiaId={materia.id} anoId={anoAtivoId || 0} />
      </div>
    </div>
  )
}

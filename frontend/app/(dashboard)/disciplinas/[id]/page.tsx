'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, use } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia } from '@/types/academico'
import { 
  AlertTriangle, 
  Loader2, 
  ArrowLeft,
  Calendar,
  GraduationCap,
  FileText,
  Clock,
  Timer
} from 'lucide-react'
import Link from 'next/link'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { CardGestaoNotas } from '@/components/organisms/CardGestaoNotas'

interface PaginaDisciplinaProps {
  params: Promise<{ id: string }>
}

export default function PaginaDisciplina({ params }: PaginaDisciplinaProps) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { anoAtivoId } = useAcademico()
  const [materia, setMateria] = useState<Materia | null>(null)
  const [loading, setLoading] = useState(true)

  const buscarDados = useCallback(async () => {
    if (!session?.accessToken || !anoAtivoId) return

    setLoading(true)
    try {
      const perfil = await academic_service.obterPerfil(session.accessToken, anoAtivoId)
      const encontrada = perfil.materias?.find(m => m.id === parseInt(id))
      if (encontrada) {
        setMateria(encontrada)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da disciplina:', error)
    } finally {
      setLoading(false)
    }
  }, [session, anoAtivoId, id])

  useEffect(() => {
    buscarDados()
  }, [buscarDados])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando detalhes da disciplina...</p>
      </div>
    )
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
  const maxFaltas = primeiroHorario?.maximo_faltas || 0
  const porcentagemFaltas = (materia.faltas_atuais / maxFaltas) * 100

  // Lógica para próximos compromissos
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const proximasAvaliacoes = (materia.configuracao_notas?.avaliacoes || [])
    .filter(a => a.data && new Date(a.data + 'T12:00:00') >= hoje && a.nota === null)
    .sort((a, b) => a.data!.localeCompare(b.data!))
    .slice(0, 3)

  const calcularDiasRestantes = (dataStr: string) => {
    const dataAlvo = new Date(dataStr)
    const diffTime = dataAlvo.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Amanhã'
    return `Em ${diffDays} dias`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Cabeçalho */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Notas e Arquivos (Futuro) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
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

          {/* Placeholder para Arquivos do Classroom */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm opacity-60 grayscale-[0.5] border-dashed">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-muted p-2.5 rounded-xl">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Materiais (Classroom)</h2>
                <p className="text-xs text-muted-foreground font-medium">Arquivos e documentos da disciplina</p>
              </div>
            </div>
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium italic">Em breve: Integração com o Google Classroom</p>
              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">Você poderá baixar, renomear e organizar seus arquivos automaticamente em pastas.</p>
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Faltas e Horários */}
        <div className="space-y-8">
          {/* Card de Próximos Compromissos */}
          {proximasAvaliacoes.length > 0 && (
            <div className="bg-primary border border-primary/20 rounded-3xl p-8 shadow-lg shadow-primary/10 text-primary-foreground">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Próximos Prazos</h2>
                  <p className="text-xs text-white/60 font-bold uppercase tracking-wider">Fique atento!</p>
                </div>
              </div>

              <div className="space-y-4">
                {proximasAvaliacoes.map((a, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-white/5">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">{a.nome}</p>
                      <p className="text-[10px] font-bold text-white/60 uppercase">
                        {new Date(a.data! + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-xs font-black bg-white text-primary px-2.5 py-1 rounded-full shadow-sm uppercase">
                      {calcularDiasRestantes(a.data!)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card de Faltas */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Frequência</h2>
                <p className="text-xs text-muted-foreground font-medium">Controle de ausências</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-baseline gap-1">
                    <p className="text-5xl font-black text-foreground">{materia.faltas_atuais}</p>
                    <p className="text-sm font-bold text-muted-foreground">faltas</p>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Limite: {maxFaltas}</p>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      materia.faltas_atuais > maxFaltas ? 'bg-destructive' : porcentagemFaltas >= 80 ? 'bg-yellow-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(porcentagemFaltas, 100)}%` }}
                  />
                </div>
              </div>

              {materia.detalhes_faltas && materia.detalhes_faltas.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Histórico Recente</p>
                  <div className="flex flex-col gap-2">
                    {materia.detalhes_faltas.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-3 bg-muted/30 rounded-xl border border-border/50">
                        <span className="font-bold text-foreground">{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span className="text-primary font-black text-xs bg-primary/10 px-2 py-0.5 rounded-full">{f.faltas} FAULTA(S)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card de Horários */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Horários</h2>
                <p className="text-xs text-muted-foreground font-medium">Cronograma semanal</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {materia.horarios?.map((h, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl">
                  <div className="bg-background w-10 h-10 rounded-lg flex flex-col items-center justify-center border border-border">
                    <span className="text-[10px] font-black text-muted-foreground uppercase leading-none">DIA</span>
                    <span className="text-sm font-black text-primary">{h.dia + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground uppercase tracking-tight">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][h.dia - 1]}
                    </p>
                    <p className="text-xs text-muted-foreground font-bold">
                      {h.inicio.slice(0, 5)} - {h.fim.slice(0, 5)} • Bloco {h.bloco} ({h.sala})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

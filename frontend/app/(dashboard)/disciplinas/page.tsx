'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia } from '@/types/academico'
import { BookOpen, AlertTriangle, CheckCircle2, Loader2, CalendarDays } from 'lucide-react'
import Link from 'next/link'

export default function DisciplinasPage() {
  const { data: session } = useSession()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const buscarPerfil = useCallback(async () => {
    if (!session?.accessToken) return

    try {
      const data = await academic_service.obterPerfil(session.accessToken)
      setPerfil(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    buscarPerfil()
  }, [buscarPerfil])

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Minhas Disciplinas</h2>
        <p className="text-muted-foreground mt-2">Gerencie suas faltas através do calendário de horários.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {perfil.materias.map((materia: Materia) => {
          const primeiroHorario = materia.horarios?.[0]
          if (!primeiroHorario) return null

          const maxFaltas = primeiroHorario.maximo_faltas
          const porcentagemFaltas = (materia.faltas_atuais / maxFaltas) * 100
          const noLimite = porcentagemFaltas >= 80
          const reprovado = materia.faltas_atuais > maxFaltas

          return (
            <div key={materia.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{materia.nome}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {materia.codigo} • Turma {primeiroHorario.turma}
                    </p>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                    {primeiroHorario.departamento}
                  </span>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Faltas</p>
                      <p className="text-3xl font-black text-foreground">
                        {materia.faltas_atuais} <span className="text-sm font-normal text-muted-foreground">/ {maxFaltas}</span>
                      </p>
                    </div>
                    <Link 
                      href="/horarios"
                      className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                    >
                      <CalendarDays className="w-4 h-4" />
                      Marcar no Calendário
                    </Link>
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
                      <div className="flex items-center gap-1.5 text-destructive font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Reprovado por faltas
                      </div>
                    ) : noLimite ? (
                      <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Atenção ao limite de faltas
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Frequência regular
                      </div>
                    )}
                  </div>
                  
                  {materia.detalhes_faltas && materia.detalhes_faltas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Histórico de Ausências</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          materia.detalhes_faltas.reduce((acc, f) => {
                            acc[f.data] = (acc[f.data] || 0) + f.faltas;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                        .sort((a, b) => b[0].localeCompare(a[0])) // Ordena das mais recentes para as mais antigas
                        .map(([data, total]) => (
                          <span key={data} className="text-[10px] bg-muted px-2 py-1 rounded-lg text-foreground font-medium">
                            {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')} ({total})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                <span>Início: {new Date(primeiroHorario.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <span>Término: {new Date(primeiroHorario.data_termino + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

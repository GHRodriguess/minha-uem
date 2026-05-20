'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia } from '@/types/academico'
import { BookOpen, AlertTriangle, CheckCircle2, Loader2, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { useAcademico } from '@/components/providers/ProvedorAcademico'

export default function DisciplinasPage() {
  const { data: session } = useSession()
  const { anoAtivoId, versao } = useAcademico()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Minhas Disciplinas</h2>
        <p className="text-muted-foreground mt-2">Selecione uma disciplina para gerenciar notas, faltas e materiais.</p>
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
    </div>
  )
}

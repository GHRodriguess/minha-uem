'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia } from '@/types/academico'
import CardUploadPDF from '@/components/organisms/CardUploadPDF'
import { BookOpen, GraduationCap, Calendar, Clock, Loader2 } from 'lucide-react'

export default function Home() {
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
        <p className="text-muted-foreground font-medium">Carregando seus dados...</p>
      </div>
    )
  }

  if (!perfil?.configurado) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <CardUploadPDF 
          token={session?.accessToken || ''} 
          onSuccess={(novoPerfil) => setPerfil(novoPerfil)} 
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-muted-foreground mt-2">Bem-vindo ao seu painel acadêmico.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Curso</p>
          <p className="text-lg font-bold text-foreground mt-1 truncate" title={`${perfil.curso?.codigo} - ${perfil.curso?.nome}`}>
            {perfil.curso?.codigo} - {perfil.curso?.nome}
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Disciplinas</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {perfil.materias?.length}
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Status do Período</p>
          <p className="text-2xl font-bold text-foreground mt-1">Ativo</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Próxima Aula</p>
          <p className="text-lg font-bold text-foreground mt-1">Em breve</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Suas Disciplinas</h3>
          <div className="space-y-4">
            {perfil.materias?.map((materia: Materia) => (
              <div key={materia.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-bold text-foreground">{materia.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">{materia.codigo} • Turma {materia.turma}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {materia.departamento}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Horário Hoje</h3>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
            <Calendar className="w-12 h-12 mb-4 opacity-20" />
            <p>Seus horários aparecerão aqui em breve.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

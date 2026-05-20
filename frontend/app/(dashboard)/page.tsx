'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia, Horario } from '@/types/academico'
import CardUploadPDF from '@/components/organisms/CardUploadPDF'
import { BookOpen, GraduationCap, Calendar, Clock, Loader2, MapPin } from 'lucide-react'
import { useAcademico } from '@/components/providers/ProvedorAcademico'

export default function Home() {
  const { data: session } = useSession()
  const { anoAtivoId: activeYearId, versao: version, anosDisponiveis: availableYears } = useAcademico()
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const buscarPerfil = useCallback(async () => {
    if (!session?.accessToken) return

    setLoading(true)
    try {
      const data = await academic_service.obterPerfil(session.accessToken, activeYearId || undefined)
      setProfile(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }, [session, activeYearId])

  useEffect(() => {
    buscarPerfil()
  }, [buscarPerfil, version])

  const filtrarAulasHoje = () => {
    if (!profile?.materias) return []
    const today = new Date()
    const dayOfWeek = today.getDay()
    const backendDay = dayOfWeek === 0 ? 7 : dayOfWeek

    const classes: { materia: Materia; horario: Horario }[] = []
    profile.materias.forEach(m => {
      const firstSchedule = m.horarios?.[0]
      if (!firstSchedule) return

      const [yearS, monthS, dayS] = firstSchedule.data_inicio.split('-').map(Number)
      const [yearE, monthE, dayE] = firstSchedule.data_termino.split('-').map(Number)
      
      const todayPure = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startPure = new Date(yearS, monthS - 1, dayS)
      const endPure = new Date(yearE, monthE - 1, dayE)

      if (todayPure >= startPure && todayPure <= endPure) {
        m.horarios?.forEach(h => {
          if (h.dia === backendDay) {
            classes.push({ materia: m, horario: h })
          }
        })
      }
    })
    return classes.sort((a, b) => a.horario.inicio.localeCompare(b.horario.inicio))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando seus dados...</p>
      </div>
    )
  }

  if (!profile?.configurado) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <CardUploadPDF 
          token={session?.accessToken || ''} 
          onSuccess={(newProfile) => setProfile(newProfile)} 
        />
      </div>
    )
  }

  const todayClasses = filtrarAulasHoje()

  const obterProximaAula = () => {
    const now = new Date()
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return todayClasses.find(a => a.horario.inicio > timeString)
  }

  const nextClass = obterProximaAula()
  const activeAcademicYear = availableYears.find(a => a.id === activeYearId)?.ano

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
          <p className="text-lg font-bold text-foreground mt-1 truncate" title={`${profile.curso?.codigo} - ${profile.curso?.nome}`}>
            {profile.curso?.codigo} - {profile.curso?.nome}
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Disciplinas</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {profile.materias?.length}
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Ano Letivo</p>
          <p className="text-2xl font-bold text-foreground mt-1">{activeAcademicYear || '---'}</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Próxima Aula</p>
          <p className="text-lg font-bold text-foreground mt-1">
            {nextClass ? nextClass.horario.inicio.substring(0, 5) : 'Sem mais hoje'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Suas Disciplinas</h3>
          <div className="space-y-4">
            {profile.materias?.map((materia: Materia) => (
              <div key={materia.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-bold text-foreground">{materia.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">{materia.codigo} • Turma {materia.horarios?.[0]?.turma}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {materia.horarios?.[0]?.departamento}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Horário Hoje</h3>
          <div className="space-y-4">
            {todayClasses.length > 0 ? (
              todayClasses.map((aula, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground">{aula.materia.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {aula.horario.inicio.substring(0, 5)} - {aula.horario.fim.substring(0, 5)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <MapPin className="w-7 h-7"/>
                        <span className='text-left pl-1'>{aula.horario.sala.replace("-", " ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhuma aula hoje.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

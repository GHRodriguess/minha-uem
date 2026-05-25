'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil } from '@/types/academico'
import CardUploadPDF from '@/components/organisms/CardUploadPDF'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import CarregamentoHome from '@/components/templates/CarregamentoHome'
import { CardMateriaHome } from '@/components/organisms/CardMateriaHome'
import { GridEstatisticasHome } from '@/components/organisms/GridEstatisticasHome'
import { PainelLateralHome } from '@/components/organisms/PainelLateralHome'
import { obterAulasHoje } from '@/lib/utils/aulas'

export default function Home() {
  const { data: session } = useSession()
  const { anoAtivoId: activeYearId, versao: version, anosDisponiveis: availableYears } = useAcademico()
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const buscarPerfil = useCallback(async () => {
    if (!session?.accessToken) return
    setLoading(true)
    try {
      const data = await academic_service.obterPerfil(session.accessToken, activeYearId || undefined, false, true)
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

  const alternarFalta = async (materiaId: number, dateStr: string, classNum: number, hasAbsence: boolean) => {
    if (!session?.accessToken) return
    const newAbsences = hasAbsence ? 0 : 1
    try {
      await academic_service.atualizarFaltas(session.accessToken, materiaId, dateStr, classNum, newAbsences, activeYearId || undefined)
      setProfile(prev => {
        if (!prev || !prev.materias) return prev
        const updated = prev.materias.map(m => {
          if (m.id !== materiaId) return m
          const current = m.detalhes_faltas || []
          const updatedAbsences = newAbsences === 0
            ? current.filter(f => !(f.data === dateStr && f.aula === classNum))
            : [...current.filter(f => !(f.data === dateStr && f.aula === classNum)), { data: dateStr, aula: classNum, faltas: 1 }]
          return { ...m, detalhes_faltas: updatedAbsences, faltas_atuais: updatedAbsences.reduce((acc, f) => acc + f.faltas, 0) }
        })
        return { ...prev, materias: updated }
      })
    } catch (error) {
      console.error('Erro ao atualizar faltas:', error)
    }
  }

  if (loading) return <CarregamentoHome />
  if (!profile?.configurado) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <CardUploadPDF token={session?.accessToken || ''} onSuccess={setProfile} />
      </div>
    )
  }

  const todayClasses = obterAulasHoje(profile)
  const todayStr = new Date().toISOString().split('T')[0]
  const nextClass = todayClasses.find(a => a.horario.inicio > `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`)
  const activeYearLabel = availableYears.find(a => a.id === activeYearId)?.ano || '---'

  const sortedMaterias = [...(profile.materias || [])].sort((a, b) => {
    const firstA = a.horarios?.[0]
    const firstB = b.horarios?.[0]
    const isEmCursoA = firstA && todayStr >= firstA.data_inicio && todayStr <= firstA.data_termino ? 1 : 0
    const isEmCursoB = firstB && todayStr >= firstB.data_inicio && todayStr <= firstB.data_termino ? 1 : 0
    return isEmCursoB - isEmCursoA || a.nome.localeCompare(b.nome)
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <section>
        <h2 className="text-3xl font-black text-foreground tracking-tight">Visão Geral</h2>
        <p className="text-sm text-muted-foreground mt-1 font-semibold">Painel acadêmico integrado.</p>
      </section>

      <GridEstatisticasHome profile={profile} activeYearLabel={activeYearLabel} nextClass={nextClass} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-foreground mb-6 uppercase tracking-wider">Suas Disciplinas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedMaterias.map(materia => (
              <CardMateriaHome key={materia.id} materia={materia} />
            ))}
          </div>
        </div>

        <PainelLateralHome aulasHoje={todayClasses} dataString={todayStr} onAlternarFalta={alternarFalta} materias={profile.materias || []} />
      </div>
    </div>
  )
}

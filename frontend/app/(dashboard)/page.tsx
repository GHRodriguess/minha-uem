'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { academic_service } from '@/lib/api/academico'
import CardUploadPDF from '@/components/organisms/CardUploadPDF'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import CarregamentoHome from '@/components/templates/CarregamentoHome'
import { CardMateriaHome } from '@/components/organisms/CardMateriaHome'
import { BannerBoasVindas } from '@/components/organisms/BannerBoasVindas'
import { CalendarioEventosHoje } from '@/components/organisms/CalendarioEventosHoje'
import { ListaEventosProximos } from '@/components/organisms/ListaEventosProximos'
import { obterAulasHoje } from '@/lib/utils/aulas'

export default function Home() {
  const { data: session } = useSession()
  const { anoAtivoId: activeYearId, carregandoAnos, perfil: profile, setPerfil: setProfile } = useAcademico()
  const [activeTab, setActiveTab] = useState<'hoje' | 'disciplinas'>('hoje')

  const alternarFalta = async (subjectId: number, dateStr: string, classNum: number, hasAbsence: boolean) => {
    if (!session?.accessToken) return
    const newAbsences = hasAbsence ? 0 : 1
    try {
      await academic_service.atualizarFaltas(session.accessToken, subjectId, dateStr, classNum, newAbsences, activeYearId || undefined)
      setProfile(prev => {
        if (!prev || !prev.materias) return prev
        const updated = prev.materias.map(m => {
          if (m.id !== subjectId) return m
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

  if (carregandoAnos && !profile) return <CarregamentoHome />
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

  const sortedMaterias = [...(profile.materias || [])].sort((a, b) => {
    const firstA = a.horarios?.[0]
    const firstB = b.horarios?.[0]
    const isActiveA = firstA && todayStr >= firstA.data_inicio && todayStr <= firstA.data_termino ? 1 : 0
    const isActiveB = firstB && todayStr >= firstB.data_inicio && todayStr <= firstB.data_termino ? 1 : 0
    return isActiveB - isActiveA || a.nome.localeCompare(b.nome)
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <BannerBoasVindas profile={profile} nextClass={nextClass} />

      <div className="flex border-b border-border/40 gap-6">
        <button
          onClick={() => setActiveTab('hoje')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'hoje' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setActiveTab('disciplinas')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'disciplinas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Minhas Disciplinas
        </button>
      </div>

      {activeTab === 'hoje' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Aulas de Hoje</h3>
            <CalendarioEventosHoje aulasHoje={todayClasses} dataString={todayStr} onAlternarFalta={alternarFalta} />
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Avaliações Próximas</h3>
            <ListaEventosProximos materias={profile.materias || []} dataString={todayStr} />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Suas Disciplinas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMaterias.map(subject => (
              <CardMateriaHome key={subject.id} subject={subject} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

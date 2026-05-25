'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia } from '@/types/academico'
import { BookOpen, ListFilter } from 'lucide-react'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { CardDisciplina } from '@/components/organisms/CardDisciplina'
import CarregamentoDisciplinas from '@/components/templates/CarregamentoDisciplinas'

type Ordenacao = 'nome' | 'faltas' | 'andamento'
type Agrupamento = 'nenhum' | 'departamento'

export default function DisciplinasPage() {
  const { data: session } = useSession()
  const { anoAtivoId, versao } = useAcademico()
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<Ordenacao>('andamento')
  const [groupType, setGroupType] = useState<Agrupamento>('nenhum')

  const buscarPerfil = useCallback(async (silencioso = false) => {
    if (!session?.accessToken) return

    if (!silencioso) {
      setLoading(true)
    }
    try {
      const data = await academic_service.obterPerfil(session.accessToken, anoAtivoId || undefined)
      setProfile(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      if (!silencioso) {
        setLoading(false)
      }
    }
  }, [session, anoAtivoId])

  useEffect(() => {
    buscarPerfil()
  }, [buscarPerfil, versao])

  if (loading) {
    return <CarregamentoDisciplinas />
  }

  if (!profile?.materias || profile.materias.length === 0) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Nenhuma disciplina encontrada</h2>
        <p className="text-muted-foreground mt-2">Faça o upload do seu PDF na página inicial para começar.</p>
      </div>
    )
  }

  const processedMaterias = [...profile.materias].sort((a, b) => {
    if (sortOrder === 'nome') {
      return a.nome.localeCompare(b.nome)
    } else if (sortOrder === 'faltas') {
      return b.faltas_atuais - a.faltas_atuais
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const isCurrent = (m: Materia) => {
        const h = m.horarios?.[0]
        if (!h) return false
        const start = new Date(h.data_inicio + 'T00:00:00')
        const end = new Date(h.data_termino + 'T23:59:59')
        return today >= start && today <= end
      }

      const aCurrent = isCurrent(a)
      const bCurrent = isCurrent(b)

      if (aCurrent && !bCurrent) return -1
      if (!aCurrent && bCurrent) return 1
      
      return a.nome.localeCompare(b.nome)
    }
  })

  const renderizarGrade = (materiasList: Materia[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {materiasList.map((materia: Materia) => (
        <CardDisciplina key={materia.id} materia={materia} />
      ))}
    </div>
  )

  const departments = Array.from(
    new Set(processedMaterias.map(m => m.horarios?.[0]?.departamento).filter(Boolean))
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Minhas Disciplinas</h2>
          <p className="text-muted-foreground mt-1 font-medium">Gerencie suas notas, faltas e materiais de estudo</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-2">
            <ListFilter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Visualização:</span>
          </div>
          
          <select 
            value={groupType}
            onChange={(e) => setGroupType(e.target.value as Agrupamento)}
            className="bg-background border border-border rounded-xl px-2 h-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial min-w-32.5"
          >
            <option value="nenhum">Sem Agrupamento</option>
            <option value="departamento">Por Departamento</option>
          </select>

          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as Ordenacao)}
            className="bg-background border border-border rounded-xl px-2 h-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial min-w-32.5"
          >
            <option value="andamento">Em Andamento</option>
            <option value="nome">Nome (A-Z)</option>
            <option value="faltas">Mais Faltas</option>
          </select>
        </div>
      </section>

      {groupType === 'departamento' ? (
        <div className="space-y-12">
          {departments.map(dept => {
            const materiasDept = processedMaterias.filter(m => m.horarios?.[0]?.departamento === dept)
            return (
              <div key={dept} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {dept}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {materiasDept.length} {materiasDept.length === 1 ? 'matéria' : 'matérias'}
                  </span>
                </div>
                {renderizarGrade(materiasDept)}
              </div>
            )
          })}
        </div>
      ) : (
        renderizarGrade(processedMaterias)
      )}
    </div>
  )
}

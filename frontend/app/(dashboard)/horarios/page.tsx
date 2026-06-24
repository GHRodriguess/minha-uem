'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { academic_service } from '@/lib/api/academico'
import { Materia, Horario } from '@/types/academico'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { FiltrosCalendario } from '@/components/molecules/FiltrosCalendario'
import CarregamentoHorarios from '@/components/templates/CarregamentoHorarios'
import { CalendarioGrade } from '@/components/organisms/CalendarioGrade'
import { CalendarioListaEventos } from '@/components/organisms/CalendarioListaEventos'
import { obterDataFormatada } from '@/lib/utils'

export default function HorariosPage() {
  const { data: session } = useSession()
  const { anoAtivoId, anosDisponiveis, carregandoAnos, perfil: profile, setPerfil: setProfile } = useAcademico()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filters, setFilters] = useState({ aulas: true, avaliacoes: true })
  const prevYearId = useRef<number | null>(null)

  useEffect(() => {
    if (anoAtivoId && prevYearId.current !== anoAtivoId) {
      const foundYear = anosDisponiveis.find(a => a.id === anoAtivoId)
      if (foundYear) {
        setSelectedDate(prev => {
          const newDate = new Date(prev)
          newDate.setFullYear(foundYear.ano)
          if (prev.getFullYear() !== foundYear.ano) {
            newDate.setMonth(2)
            newDate.setDate(1)
          }
          return newDate
        })
      }
      prevYearId.current = anoAtivoId
    }
  }, [anoAtivoId, anosDisponiveis])

  const mudarMes = (delta: number) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + delta)
      return newDate
    })
  }

  const filtrarEventosDoDia = useCallback((date: Date) => {
    if (!profile?.materias) return { aulas: [], avaliacoes: [] }

    const dayOfWeek = date.getDay()
    const backendDay = dayOfWeek === 0 ? 7 : dayOfWeek
    const dateString = obterDataFormatada(date)

    const classes: { materia: Materia; horario: Horario }[] = []
    const assessments: { materia: Materia; avaliacao: any }[] = []

    profile.materias.forEach(m => {
      const firstSchedule = m.horarios?.[0]
      if (firstSchedule) {
        const [yearI, monthI, dayI] = firstSchedule.data_inicio.split('-').map(Number)
        const [yearT, monthT, dayT] = firstSchedule.data_termino.split('-').map(Number)
        const datePure = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const startPure = new Date(yearI, monthI - 1, dayI)
        const endPure = new Date(yearT, monthT - 1, dayT)

        if (datePure >= startPure && datePure <= endPure) {
          m.horarios?.forEach(h => {
            if (h.dia === backendDay) {
              classes.push({ materia: m, horario: h })
            }
          })
        }
      }

      m.configuracao_notas?.avaliacoes?.forEach(a => {
        if (a.data === dateString) {
          assessments.push({ materia: m, avaliacao: a })
        }
      })
    })

    return {
      aulas: classes.sort((a, b) => a.horario.inicio.localeCompare(b.horario.inicio)),
      avaliacoes: assessments
    }
  }, [profile])

  const alternarFalta = async (materiaId: number, dateStr: string, classNum: number, hasAbsence: boolean) => {
    if (!session?.accessToken) return

    const newAbsences = hasAbsence ? 0 : 1
    try {
      await academic_service.atualizarFaltas(session.accessToken, materiaId, dateStr, classNum, newAbsences, anoAtivoId || undefined)
      setProfile(prev => {
        if (!prev || !prev.materias) return prev
        const updatedMaterias = prev.materias.map(m => {
          if (m.id !== materiaId) return m
          const currentAbsences = m.detalhes_faltas || []
          let updatedAbsences = [...currentAbsences]
          if (newAbsences === 0) {
            updatedAbsences = currentAbsences.filter(f => !(f.data === dateStr && f.aula === classNum))
          } else {
            const exists = currentAbsences.some(f => f.data === dateStr && f.aula === classNum)
            if (!exists) {
              updatedAbsences.push({ data: dateStr, aula: classNum, faltas: 1 })
            }
          }
          const newTotal = updatedAbsences.reduce((acc, f) => acc + (f.faltas || 0), 0)
          return {
            ...m,
            detalhes_faltas: updatedAbsences,
            faltas_atuais: newTotal
          }
        })
        return {
          ...prev,
          materias: updatedMaterias
        }
      })
    } catch (error) {
      console.error('Erro ao atualizar faltas:', error)
    }
  }

  if (carregandoAnos && !profile) {
    return <CarregamentoHorarios />
  }

  const eventsToday = filtrarEventosDoDia(selectedDate)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Calendário Acadêmico</h2>
        <p className="text-muted-foreground mt-2">Navegue pelos seus horários ao longo do ano.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <CalendarioGrade 
            dataSelecionada={selectedDate}
            onMudarData={(date) => setSelectedDate(date)}
            onMudarMes={mudarMes}
            filtrarEventosDoDia={filtrarEventosDoDia}
          />
          <FiltrosCalendario 
            filtros={filters}
            onChange={(newFilters) => setFilters(newFilters)}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <CalendarioListaEventos 
            dataSelecionada={selectedDate}
            eventosHoje={eventsToday}
            filtros={filters}
            onAlternarFalta={alternarFalta}
          />
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex gap-4">
          <div className="bg-primary/10 p-3 rounded-xl shrink-0 h-fit self-center">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Sincronize com sua Agenda Pessoal</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Adicione suas aulas, provas e trabalhos automaticamente no Google Agenda, Apple Calendar ou Notion Calendar de forma simples e segura!
            </p>
          </div>
        </div>
        <Link href="/configuracoes" className="shrink-0 w-full md:w-auto">
          <Button className="h-11 px-5 rounded-xl font-black uppercase tracking-widest text-xs gap-2 w-full md:w-auto">
            Configurar
          </Button>
        </Link>
      </div>
    </div>
  )
}

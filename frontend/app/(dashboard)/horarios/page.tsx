'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia, Horario } from '@/types/academico'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { FiltrosCalendario } from '@/components/molecules/FiltrosCalendario'
import { CalendarioGrade } from '@/components/organisms/CalendarioGrade'
import { CalendarioListaEventos } from '@/components/organisms/CalendarioListaEventos'

export default function HorariosPage() {
  const { data: session } = useSession()
  const { anoAtivoId, anosDisponiveis, versao } = useAcademico()
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filters, setFilters] = useState({ aulas: true, avaliacoes: true })
  const prevYearId = useRef<number | null>(null)

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
    const dateString = date.toISOString().split('T')[0]

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
      buscarPerfil(true)
    } catch (error) {
      console.error('Erro ao atualizar faltas:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando horários...</p>
      </div>
    )
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

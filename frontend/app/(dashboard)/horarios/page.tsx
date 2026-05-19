'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia, Horario } from '@/types/academico'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Loader2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HorariosPage() {
  const { data: session } = useSession()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataSelecionada, setDataSelecionada] = useState(new Date())

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

  const mudarMes = (delta: number) => {
    setDataSelecionada(prev => {
      const nova = new Date(prev)
      nova.setMonth(prev.getMonth() + delta)
      return nova
    })
  }

  const getDiasDoMes = () => {
    const ano = dataSelecionada.getFullYear()
    const mes = dataSelecionada.getMonth()
    const primeiroDia = new Date(ano, mes, 1).getDay()
    const ultimoDia = new Date(ano, mes + 1, 0).getDate()
    
    const dias = []
    for (let i = 0; i < (primeiroDia === 0 ? 6 : primeiroDia - 1); i++) {
      dias.push(null)
    }
    for (let i = 1; i <= ultimoDia; i++) {
      dias.push(new Date(ano, mes, i))
    }
    return dias
  }

  const formatarData = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatarMesAno = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  const filtrarAulasDoDia = (data: Date) => {
    if (!perfil?.materias) return []

    const diaSemana = data.getDay()
    const backendDia = diaSemana === 0 ? 7 : diaSemana

    const aulas: { materia: Materia; horario: Horario }[] = []

    perfil.materias.forEach(materia => {
      const [anoI, mesI, diaI] = materia.inicio.split('-').map(Number)
      const [anoT, mesT, diaT] = materia.termino.split('-').map(Number)
      
      const dataPura = new Date(data.getFullYear(), data.getMonth(), data.getDate())
      const inicioPura = new Date(anoI, mesI - 1, diaI)
      const terminoPura = new Date(anoT, mesT - 1, diaT)

      if (dataPura >= inicioPura && dataPura <= terminoPura) {
        materia.horarios?.forEach(h => {
          if (h.dia === backendDia) {
            aulas.push({ materia, horario: h })
          }
        })
      }
    })

    return aulas.sort((a, b) => a.horario.inicio.localeCompare(b.horario.inicio))
  }

  const alternarFalta = async (materiaId: number, data: string, aulaNum: number, temFalta: boolean) => {
    if (!session?.accessToken) return

    const novasFaltas = temFalta ? 0 : 1
    try {
      await academic_service.atualizarFaltas(session.accessToken, materiaId, data, aulaNum, novasFaltas)
      buscarPerfil()
    } catch (error) {
      console.error('Erro ao atualizar faltas:', error)
    }
  }

  const aulasHoje = filtrarAulasDoDia(dataSelecionada)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando horários...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-foreground">Calendário Acadêmico</h2>
        <p className="text-muted-foreground mt-2">Navegue pelos seus horários ao longo do ano.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-foreground text-sm">{formatarMesAno(dataSelecionada)}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mudarMes(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => mudarMes(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-2">
            <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDiasDoMes().map((dia, idx) => {
              if (!dia) return <div key={`empty-${idx}`} className="h-10" />
              
              const isHoje = new Date().toDateString() === dia.toDateString()
              const isSelecionado = dataSelecionada.toDateString() === dia.toDateString()
              const aulasNoDia = filtrarAulasDoDia(dia).length > 0

              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => setDataSelecionada(dia)}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                    isSelecionado 
                      ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' 
                      : 'hover:bg-muted text-foreground'
                  } ${isHoje && !isSelecionado ? 'border border-primary/50' : ''}`}
                >
                  <span className="text-sm">{dia.getDate()}</span>
                  {aulasNoDia && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelecionado ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{formatarData(dataSelecionada)}</h3>
              <p className="text-sm text-muted-foreground">{aulasHoje.length} aulas programadas</p>
            </div>
          </div>

          <div className="space-y-4">
            {aulasHoje.length > 0 ? (
              aulasHoje.map((aula, idx) => {
                const ano = dataSelecionada.getFullYear();
                const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
                const dia = String(dataSelecionada.getDate()).padStart(2, '0');
                const dataString = `${ano}-${mes}-${dia}`;
                const temFalta = aula.materia.detalhes_faltas?.some(f => f.data === dataString && f.aula === aula.horario.aula && f.faltas > 0)

                return (
                  <div key={`${aula.materia.id}-${idx}`} className={`bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${temFalta ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="bg-muted w-16 h-16 rounded-xl flex flex-col items-center justify-center border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Aula</span>
                        <span className="text-2xl font-black text-foreground">{aula.horario.aula}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-lg text-foreground leading-tight">{aula.materia.nome}</h4>
                          {temFalta && (
                            <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full uppercase">Falta Marcada</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {aula.materia.codigo} • Turma {aula.materia.turma}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 md:gap-8 items-center text-sm">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {aula.horario.inicio.substring(0, 5)} - {aula.horario.fim.substring(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">Sala {aula.horario.sala}</span>
                        </div>
                      
                      <Button 
                        variant={temFalta ? "destructive" : "outline"} 
                        size="sm" 
                        className="rounded-xl gap-2"
                        onClick={() => alternarFalta(aula.materia.id, dataString, aula.horario.aula, !!temFalta)}
                      >
                        <UserX className="w-4 h-4" />
                        {temFalta ? "Remover Falta" : "Marcar Falta"}
                      </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-medium">Nenhuma aula para este dia.</p>
                <p className="text-xs">Aproveite para descansar ou estudar!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

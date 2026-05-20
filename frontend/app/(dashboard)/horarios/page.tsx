'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil, Materia, Horario } from '@/types/academico'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Loader2, UserX, GraduationCap, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAcademico } from '@/components/providers/ProvedorAcademico'

export default function HorariosPage() {
  const { data: session } = useSession()
  const { anoAtivoId, anosDisponiveis, versao } = useAcademico()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [filtros, setFiltros] = useState({ aulas: true, avaliacoes: true })
  const prevAnoId = useRef<number | null>(null)

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

  // Atualiza o calendário para o ano selecionado quando o contexto muda
  useEffect(() => {
    if (anoAtivoId && prevAnoId.current !== anoAtivoId) {
      const anoEncontrado = anosDisponiveis.find(a => a.id === anoAtivoId)
      if (anoEncontrado) {
        setDataSelecionada(prev => {
          const novaData = new Date(prev)
          novaData.setFullYear(anoEncontrado.ano)
          // Se o ano mudou, reseta para Março (início comum na UEM)
          if (prev.getFullYear() !== anoEncontrado.ano) {
            novaData.setMonth(2)
            novaData.setDate(1)
          }
          return novaData
        })
      }
      prevAnoId.current = anoAtivoId
    }
  }, [anoAtivoId, anosDisponiveis])

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
    // Domingo (0) -> 0 slots vazios, Segunda (1) -> 1 slot, etc.
    for (let i = 0; i < primeiroDia; i++) {
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

  const filtrarEventosDoDia = (data: Date) => {
    if (!perfil?.materias) return { aulas: [], avaliacoes: [] }

    const diaSemana = data.getDay()
    const backendDia = diaSemana === 0 ? 7 : diaSemana
    const dataString = data.toISOString().split('T')[0]

    const aulas: { materia: Materia; horario: Horario }[] = []
    const avaliacoes: { materia: Materia; avaliacao: any }[] = []

    perfil.materias.forEach(materia => {
      // Filtrar Aulas
      const primeiroHorario = materia.horarios?.[0]
      if (primeiroHorario) {
        const [anoI, mesI, diaI] = primeiroHorario.data_inicio.split('-').map(Number)
        const [anoT, mesT, diaT] = primeiroHorario.data_termino.split('-').map(Number)
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
      }

      // Filtrar Avaliações
      materia.configuracao_notas?.avaliacoes?.forEach(a => {
        if (a.data === dataString) {
          avaliacoes.push({ materia, avaliacao: a })
        }
      })
    })

    return {
      aulas: aulas.sort((a, b) => a.horario.inicio.localeCompare(b.horario.inicio)),
      avaliacoes
    }
  }

  const alternarFalta = async (materiaId: number, data: string, aulaNum: number, temFalta: boolean) => {
    if (!session?.accessToken) return

    const novasFaltas = temFalta ? 0 : 1
    try {
      await academic_service.atualizarFaltas(session.accessToken, materiaId, data, aulaNum, novasFaltas, anoAtivoId || undefined)
      buscarPerfil()
    } catch (error) {
      console.error('Erro ao atualizar faltas:', error)
    }
  }

  const eventosHoje = filtrarEventosDoDia(dataSelecionada)

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
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
              <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span>
            </div>

            <div className="grid grid-cols-7 z-10 gap-1">
              {getDiasDoMes().map((dia, idx) => {
                if (!dia) return <div key={`empty-${idx}`} className="h-10" />
                
                const isHoje = new Date().toDateString() === dia.toDateString()
                const isSelecionado = dataSelecionada.toDateString() === dia.toDateString()
                const eventos = filtrarEventosDoDia(dia)
                const temAulas = eventos.aulas.length > 0
                const temAvaliacoes = eventos.avaliacoes.length > 0

                return (
                  <button
                    key={dia.toISOString()}
                    onClick={() => setDataSelecionada(dia)}
                    className={`h-10 rounded-lg flex flex-col z-10 items-center justify-center transition-all relative ${
                      isSelecionado 
                        ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' 
                        : 'hover:bg-muted text-foreground'
                    } ${isHoje && !isSelecionado ? 'border border-primary/50' : ''}`}
                  >
                    <span className="text-sm">{dia.getDate()}</span>
                    <div className="flex gap-0.5 absolute bottom-1">
                      {temAulas && (
                        <span className={`w-1 h-1 rounded-full ${isSelecionado ? 'bg-primary-foreground' : 'bg-primary'}`} />
                      )}
                      {temAvaliacoes && (
                        <span className={`w-1 h-1 rounded-full ${isSelecionado ? 'bg-primary-foreground' : 'bg-yellow-500'}`} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-4">Filtrar Visualização</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filtros.aulas} 
                  onChange={e => setFiltros(prev => ({ ...prev, aulas: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Aulas</span>
                <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filtros.avaliacoes} 
                  onChange={e => setFiltros(prev => ({ ...prev, avaliacoes: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Avaliações</span>
                <span className="ml-auto w-2 h-2 rounded-full bg-yellow-500" />
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{formatarData(dataSelecionada)}</h3>
              <p className="text-sm text-muted-foreground">
                {(filtros.aulas ? eventosHoje.aulas.length : 0) + (filtros.avaliacoes ? eventosHoje.avaliacoes.length : 0)} compromissos filtrados
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Renderizar Avaliações Primeiro */}
            {filtros.avaliacoes && eventosHoje.avaliacoes.map((item, idx) => (
              <div key={`av-${idx}`} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 shadow-sm hover:border-yellow-500/50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-500/10 w-16 h-16 rounded-xl flex flex-col items-center justify-center border border-yellow-500/20">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground leading-tight">{item.avaliacao.nome}</h4>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      {item.materia.nome} • {item.avaliacao.tipo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black bg-yellow-500 text-white px-3 py-1 rounded-full uppercase">
                    Peso {item.avaliacao.peso}
                  </span>
                </div>
              </div>
            ))}

            {/* Renderizar Aulas */}
            {filtros.aulas && eventosHoje.aulas.length > 0 ? (
              eventosHoje.aulas.map((aula, idx) => {
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
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                          {aula.materia.codigo} • Turma {aula.horario.turma}
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
                      </div>
                      
                      <Button 
                        variant={temFalta ? "destructive" : "outline"} 
                        size="sm" 
                        className="rounded-xl gap-2 font-bold uppercase text-[10px]"
                        onClick={() => alternarFalta(aula.materia.id, dataString, aula.horario.aula, !!temFalta)}
                      >
                        <UserX className="w-4 h-4" />
                        {temFalta ? "Remover Falta" : "Marcar Falta"}
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : null}

            {(!filtros.aulas || eventosHoje.aulas.length === 0) && (!filtros.avaliacoes || eventosHoje.avaliacoes.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-medium">Nada programado para este dia.</p>
                <p className="text-xs">Aproveite para descansar ou adiantar matérias!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

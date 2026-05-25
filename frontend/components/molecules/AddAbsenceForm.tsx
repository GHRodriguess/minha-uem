'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { academic_service } from '@/lib/api/academico'
import { Horario } from '@/types/academico'
import { Button } from '../ui/button'
import { Loader2, Plus, AlertCircle } from 'lucide-react'

function obterDataFormatada(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface AddAbsenceFormProps {
  subjectId: number
  yearId: number
  schedules?: Horario[]
  onUpdate?: () => void
}

export function AddAbsenceForm({ subjectId, yearId, schedules = [], onUpdate }: AddAbsenceFormProps) {
  const { data: session } = useSession()
  const [date, setDate] = useState(obterDataFormatada(new Date()))
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [validClasses, setValidClasses] = useState<Horario[]>([])

  useEffect(() => {
    if (!date || schedules.length === 0) return
    const [yearC, monthC, dayC] = date.split('-').map(Number)
    const currentPure = new Date(yearC, monthC - 1, dayC)
    const jsDay = currentPure.getDay()
    const uemDay = jsDay === 0 ? 7 : jsDay
    
    const filtered = schedules.filter(h => {
      const [yearI, monthI, dayI] = h.data_inicio.split('-').map(Number)
      const [yearT, monthT, dayT] = h.data_termino.split('-').map(Number)
      const startPure = new Date(yearI, monthI - 1, dayI)
      const endPure = new Date(yearT, monthT - 1, dayT)
      return h.dia === uemDay && currentPure >= startPure && currentPure <= endPure
    })

    setValidClasses(filtered)
    setSelectedClasses(filtered.map(h => h.aula))
  }, [date, schedules])

  const tratarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken || selectedClasses.length === 0) return

    setLoading(true)
    try {
      await Promise.all(
        selectedClasses.map(cNum =>
          academic_service.atualizarFaltas(session.accessToken!, subjectId, date, cNum, 1, yearId)
        )
      )
      if (onUpdate) onUpdate()
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao registrar faltas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-4 border-t border-border/50">
      {!isOpen ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="w-full gap-2 font-bold text-xs uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Falta
        </Button>
      ) : (
        <form onSubmit={tratarEnvio} className="space-y-3 animate-fade-in">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Data da Aula</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-2 py-1 bg-muted border border-border rounded-lg text-xs text-foreground font-semibold"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-muted-foreground uppercase">Aulas do Dia</label>
            {validClasses.length > 0 ? (
              <div className="flex flex-col gap-1.5 bg-muted/40 border border-border/50 p-2.5 rounded-xl">
                {validClasses.map(h => (
                  <label key={h.aula} className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(h.aula)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedClasses(prev => [...prev, h.aula])
                        } else {
                          setSelectedClasses(prev => prev.filter(c => c !== h.aula))
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    <span>Aula {h.aula} ({h.inicio.slice(0, 5)} - {h.fim.slice(0, 5)})</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-destructive font-semibold flex items-center gap-1 h-7">
                <AlertCircle className="w-3.5 h-3.5" />
                Sem aula neste dia
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1 text-xs font-bold uppercase tracking-wider h-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedClasses.length === 0}
              size="sm"
              className="flex-1 text-xs font-bold uppercase tracking-wider h-8"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

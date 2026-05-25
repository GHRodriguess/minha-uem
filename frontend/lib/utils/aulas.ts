import { Perfil, Materia, Horario } from '@/types/academico'

export function obterAulasHoje(profile: Perfil | null): { materia: Materia; horario: Horario }[] {
  if (!profile?.materias) return []
  const today = new Date()
  const backendDay = today.getDay() === 0 ? 7 : today.getDay()
  return profile.materias.flatMap(m => 
    (m.horarios || []).filter(h => {
      const [yearS, monthS, dayS] = h.data_inicio.split('-').map(Number)
      const [yearE, monthE, dayE] = h.data_termino.split('-').map(Number)
      const currentPure = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      return h.dia === backendDay && currentPure >= new Date(yearS, monthS - 1, dayS) && currentPure <= new Date(yearE, monthE - 1, dayE)
    }).map(h => ({ materia: m, horario: h }))
  ).sort((a, b) => a.horario.inicio.localeCompare(b.horario.inicio))
}

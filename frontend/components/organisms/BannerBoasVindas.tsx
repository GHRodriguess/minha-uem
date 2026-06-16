'use client'

import { useSession } from 'next-auth/react'
import { GraduationCap, BookOpen, Clock, Sun, CloudSun, Moon } from 'lucide-react'
import { Perfil, Horario, Materia } from '@/types/academico'

interface BannerBoasVindasProps {
  profile: Perfil
  nextClass?: { materia: Materia; horario: Horario }
}

export function BannerBoasVindas({ profile, nextClass }: BannerBoasVindasProps) {
  const { data: session } = useSession()
  const userFirstName = session?.user?.name?.split(' ')[0] || 'Estudante'

  const obterSaudacao = () => {
    const currentHour = new Date().getHours()
    if (currentHour >= 5 && currentHour < 12) return { text: 'Bom dia', icon: Sun }
    if (currentHour >= 12 && currentHour < 18) return { text: 'Boa tarde', icon: CloudSun }
    return { text: 'Boa noite', icon: Moon }
  }

  const greetingData = obterSaudacao()
  const GreetingIcon = greetingData.icon

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary/15 via-primary/5 to-card/50 p-6 md:p-8 shadow-sm backdrop-blur-md animate-fade-in">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <GreetingIcon className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">{greetingData.text}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Olá, {userFirstName}!
          </h1>
          <p className="text-sm text-muted-foreground font-semibold">
            Seja bem-vindo de volta ao seu painel acadêmico integrado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Curso</p>
              <p className="text-xs font-bold text-foreground truncate max-w-37.5" title={profile.curso?.nome}>
                {profile.curso?.codigo || '---'}
              </p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Disciplinas</p>
              <p className="text-xs font-bold text-foreground">
                {profile.materias?.length || 0} registradas
              </p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Próxima Aula</p>
              <p className="text-xs font-bold text-foreground">
                {nextClass ? nextClass.horario.inicio.substring(0, 5) : 'Sem mais hoje'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

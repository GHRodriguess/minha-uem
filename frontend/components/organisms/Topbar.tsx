'use client'

import { useSession } from 'next-auth/react'
import BotaoTema from '../atoms/BotaoTema'
import DropdownNotificacoes from '../molecules/DropdownNotificacoes'
import InfoUsuario from '../molecules/InfoUsuario'
import { useAcademico } from '../providers/ProvedorAcademico'
import { Calendar, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onMenuClick?: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession()
  const { anoAtivoId, setAnoAtivoId, anosDisponiveis } = useAcademico()

  return (
    <header className="h-20 bg-card border-b border-border px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden h-10 w-10 text-muted-foreground hover:text-foreground rounded-xl shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          <h1 className="text-sm md:text-base font-medium text-muted-foreground">
            Olá, <span className="text-foreground font-bold">{session?.user?.name?.split(' ')[0]}</span>! Bem-vindo de volta.
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
        {anosDisponiveis.length > 0 && (
          <div className="flex items-center gap-2 bg-muted px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <select
              value={anoAtivoId || ''}
              onChange={(e) => setAnoAtivoId(parseInt(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer appearance-none"
            >
              {anosDisponiveis
                .sort((a, b) => b.ano - a.ano)
                .map((ano) => (
                <option key={ano.id} value={ano.id}>
                  Ano Letivo {ano.ano}
                </option>
              ))}
            </select>
          </div>
        )}
        <BotaoTema />
        <DropdownNotificacoes />
        <div className="w-px h-8 bg-border" />
        <InfoUsuario
          nome={session?.user?.name}
          foto={session?.user?.image}
        />
      </div>
    </header>
  )
}

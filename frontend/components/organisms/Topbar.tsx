'use client'

import { useSession } from 'next-auth/react'
import BotaoTema from '../atoms/BotaoTema'
import InfoUsuario from '../molecules/InfoUsuario'
import { useAcademico } from '../providers/ProvedorAcademico'
import { Calendar } from 'lucide-react'

export default function Topbar() {
  const { data: session } = useSession()
  const { anoAtivoId, setAnoAtivoId, anosDisponiveis } = useAcademico()

  return (
    <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-medium text-muted-foreground">
          Olá, <span className="text-foreground font-bold">{session?.user?.name?.split(' ')[0]}</span>! Bem-vindo de volta.
        </h1>
      </div>

      <div className="flex items-center gap-6">
        {anosDisponiveis.length > 0 && (
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border">
            <Calendar className="w-4 h-4 text-primary" />
            <select
              value={anoAtivoId || ''}
              onChange={(e) => setAnoAtivoId(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer appearance-none"
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
        <div className="w-px h-8 bg-border" />
        <InfoUsuario
          nome={session?.user?.name}
          foto={session?.user?.image}
        />
      </div>
    </header>
  )
}

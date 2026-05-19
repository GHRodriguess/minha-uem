'use client'

import { useSession } from 'next-auth/react'
import BotaoTema from '../atoms/BotaoTema'
import InfoUsuario from '../molecules/InfoUsuario'

export default function Topbar() {
  const { data: session } = useSession()

  return (
    <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-medium text-muted-foreground">
          Olá, <span className="text-foreground font-bold">{session?.user?.name?.split(' ')[0]}</span>! Bem-vindo de volta.
        </h1>
      </div>

      <div className="flex items-center gap-6">
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

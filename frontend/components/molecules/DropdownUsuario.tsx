'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Settings, LogOut, ChevronDown } from 'lucide-react'
import AvatarUsuario from '../atoms/AvatarUsuario'

interface DropdownUsuarioProps {
  nome?: string | null
  foto?: string | null
  email?: string | null
}

export default function DropdownUsuario({ nome, foto, email }: DropdownUsuarioProps) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function tratarCliqueFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', tratarCliqueFora)
    return () => document.removeEventListener('mousedown', tratarCliqueFora)
  }, [])

  const executarSair = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-muted/60 transition-colors focus:outline-none"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-foreground leading-none">{nome}</p>
          <p className="text-xs text-muted-foreground mt-1">Estudante</p>
        </div>
        <AvatarUsuario src={foto} alt={nome} />
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-56 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-bold text-foreground truncate">{nome}</p>
            <p className="text-xs text-muted-foreground truncate">{email || 'Estudante UEM'}</p>
          </div>

          <Link
            href="/configuracoes"
            onClick={() => setAberto(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 text-primary" />
            <span>Configurações</span>
          </Link>

          <button
            type="button"
            onClick={executarSair}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Search, Plus, LogOut, ArrowLeft, MessageSquare, Trash2, X, ArrowRight } from 'lucide-react'
import { GrupoConversas, Conversa } from '@/lib/api/ia'
import Link from 'next/link'

interface SidebarIAProps {
  conversas: GrupoConversas
  conversaAtiva: Conversa | null
  onSelecionar: (conversa: Conversa) => void
  onExcluir: (id: number) => void
  onCriar: () => void
  loading: boolean
  userName?: string | null
  sidebarAberto: boolean
  onCloseSidebar: () => void
}

export default function SidebarIA({
  conversas,
  conversaAtiva,
  onSelecionar,
  onExcluir,
  onCriar,
  loading,
  userName,
  sidebarAberto,
  onCloseSidebar
}: SidebarIAProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const todasConversas = [
    ...conversas.geral,
    ...conversas.disciplinas.flatMap(d => d.chats)
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const filtradas = todasConversas.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const obterIniciais = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col shrink-0 text-muted-foreground transition-transform duration-300 transform md:static md:translate-x-0 ${
      sidebarAberto ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <span className="font-bold text-sm text-foreground">Assistente IA</span>
        </div>
        <button
          onClick={onCloseSidebar}
          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors md:hidden cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>

        <button
          onClick={() => onCriar()}
          disabled={loading}
          className="w-full h-10 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {filtradas.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 px-3 py-4 italic text-center">Nenhuma conversa encontrada</p>
        ) : (
          filtradas.map(c => {
            const selected = conversaAtiva?.id === c.id
            return (
              <div
                key={c.id}
                onClick={() => onSelecionar(c)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                  selected ? 'bg-primary/15 border border-primary/20 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onExcluir(c.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded transition-all shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 bg-background-foreground flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
            {obterIniciais(userName)}
          </div>
          <span className="text-xs font-semibold text-foreground truncate max-w-50">{userName || 'Estudante'}</span>
        </div>        
      </div>
    </div>
  )
}

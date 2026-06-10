'use client'

import React from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import { Conversa } from '@/lib/api/ia'

interface ItemConversaIAProps {
  conversa: Conversa
  conversaAtiva: Conversa | null
  onSelecionar: (conversa: Conversa) => void
  onExcluir: (id: number) => void
}

export default function ItemConversaIA({
  conversa,
  conversaAtiva,
  onSelecionar,
  onExcluir
}: ItemConversaIAProps) {
  const isSelected = conversaAtiva?.id === conversa.id
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer group ${
        isSelected ? 'bg-primary/15 border border-primary/20 text-primary font-bold' : 'hover:bg-muted text-foreground'
      }`}
      onClick={() => onSelecionar(conversa)}
    >
      <div className="flex items-center gap-2 truncate flex-1 pr-2">
        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{conversa.title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onExcluir(conversa.id)
        }}
        className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded transition-all shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

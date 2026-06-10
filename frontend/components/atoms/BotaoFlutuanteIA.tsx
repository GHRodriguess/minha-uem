'use client'

import { Sparkles } from 'lucide-react'

interface BotaoFlutuanteIAProps {
  onClick: () => void
  isOpen: boolean
}

export default function BotaoFlutuanteIA({ onClick, isOpen }: BotaoFlutuanteIAProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
        isOpen
          ? 'bg-destructive text-destructive-foreground rotate-90'
          : 'bg-primary text-primary-foreground hover:shadow-primary/25'
      }`}
      title={isOpen ? 'Fechar Assistente' : 'Abrir Assistente com IA'}
    >
      <Sparkles className="w-6 h-6" />
    </button>
  )
}

'use client'

import { FileWarning } from 'lucide-react'

export default function FeedbackIADesativada() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <FileWarning className="w-12 h-12 text-amber-500" />
      <h3 className="text-base font-bold text-foreground">IA Desativada</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Adicione sua chave de API nas <a href="/configuracoes" className="text-primary hover:underline font-bold">Configurações</a> para habilitar o chat inteligente.
      </p>
    </div>
  )
}

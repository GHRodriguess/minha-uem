'use client'

import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ModalConfirmarExclusaoLocalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ModalConfirmarExclusaoLocal({
  isOpen,
  onClose,
  onConfirm
}: ModalConfirmarExclusaoLocalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-sm flex flex-col rounded-3xl shadow-2xl p-6 gap-4 animate-scale-modal">
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/10 rounded-full w-fit mx-auto">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        
        <div className="space-y-1.5 text-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
            Excluir arquivo offline?
          </h3>
          <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
            Esta ação apagará fisicamente o arquivo do seu computador local. Você poderá baixá-lo novamente do Google Drive quando precisar.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 h-9 border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-9 bg-destructive hover:bg-destructive/90 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  )
}

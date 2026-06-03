'use client'

import React from 'react'
import { X, FolderLock } from 'lucide-react'

interface ModalAcessoPastaProps {
  isOpen: boolean
  onClose: () => void
  onGrantAccess: () => void
}

export function ModalAcessoPasta({
  isOpen,
  onClose,
  onGrantAccess
}: ModalAcessoPastaProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-foreground">
            <FolderLock className="w-5 h-5 text-primary" />
            <h3 className="text-base font-black tracking-tight">Acesso à Pasta Local</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este arquivo está armazenado localmente na pasta vinculada. Para visualizá-lo, o navegador precisa de permissão de acesso ao diretório.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onGrantAccess()
              onClose()
            }}
            className="h-10 px-4 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold transition-opacity"
          >
            Conceder Acesso
          </button>
        </div>
      </div>
    </div>
  )
}

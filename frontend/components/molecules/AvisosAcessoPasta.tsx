'use client'

import React from 'react'

interface AvisosAcessoPastaProps {
  isFileSystemSupported: boolean
  directoryHandle: FileSystemDirectoryHandle | null
  hasFolderPermission: boolean
  onSolicitarAcesso: () => void
}

export function AvisosAcessoPasta({
  isFileSystemSupported,
  directoryHandle,
  hasFolderPermission,
  onSolicitarAcesso
}: AvisosAcessoPastaProps) {
  if (!isFileSystemSupported) return null

  if (!directoryHandle) {
    return (
      <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
        <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
          Modo offline desativado. Vincule uma pasta de estudos nas{' '}
          <a href="/configuracoes" className="text-primary hover:underline font-bold">
            Configurações Gerais
          </a>{' '}
          para acessar arquivos offline.
        </p>
      </div>
    )
  }

  if (!hasFolderPermission) {
    return (
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
          Acesso à pasta local <span className="font-bold text-primary">{directoryHandle.name}</span> suspenso pelo navegador nesta sessão.
        </p>
        <button
          onClick={onSolicitarAcesso}
          className="h-8 px-4 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-lg text-[10px] shadow-sm transition-opacity uppercase tracking-wider shrink-0 cursor-pointer"
        >
          Reautorizar Acesso
        </button>
      </div>
    )
  }

  return null
}

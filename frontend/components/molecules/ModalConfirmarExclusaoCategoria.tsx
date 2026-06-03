'use client'

import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface ModalConfirmarExclusaoProps {
  isOpen: boolean
  onClose: () => void
  categoriaNome: string
  categoriasDestino: string[]
  onConfirm: (destino: string) => void
}

export function ModalConfirmarExclusaoCategoria({
  isOpen,
  onClose,
  categoriaNome,
  categoriasDestino,
  onConfirm
}: ModalConfirmarExclusaoProps) {
  const [selectedDestiny, setSelectedDestiny] = useState(categoriasDestino[0] || 'documentos')

  if (!isOpen) return null

  const lidarComConfirmacao = () => {
    onConfirm(selectedDestiny)
  }

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'documentos') return 'Documento'
    if (tipo === 'exercicios') return 'Exercício'
    return tipo.charAt(0).toUpperCase() + tipo.slice(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-black tracking-tight">Excluir Categoria</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            A categoria <span className="font-bold text-foreground">&quot;{formatarNomeTipo(categoriaNome)}&quot;</span> está em uso por alguns arquivos. Para onde deseja mover esses arquivos?
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Categoria de Destino
            </label>
            <select
              value={selectedDestiny}
              onChange={(e) => setSelectedDestiny(e.target.value)}
              className="h-10 px-3 w-full border border-border bg-background rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              {categoriasDestino.map(cat => (
                <option key={cat} value={cat}>
                  {formatarNomeTipo(cat)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="h-10 px-4 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={lidarComConfirmacao}
            className="h-10 px-4 bg-destructive text-destructive-foreground hover:opacity-90 text-xs font-bold rounded-xl transition-opacity"
          >
            Mover e Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2, Folder } from 'lucide-react'

interface ModalGerenciarCategoriasProps {
  isOpen: boolean
  onClose: () => void
  customFolders: string[]
  onAddCategoria: (nova: string) => void
  onDeleteCategoria: (categoria: string) => void
}

export function ModalGerenciarCategorias({
  isOpen,
  onClose,
  customFolders,
  onAddCategoria,
  onDeleteCategoria
}: ModalGerenciarCategoriasProps) {
  const [inputVal, setInputVal] = useState('')

  if (!isOpen) return null

  const lidarComEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = inputVal
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\/\\:\*\?"<>\|,]/g, '')
    const lowerSanitized = sanitized.toLowerCase()
    const lowerCustom = customFolders.map(c => c.toLowerCase())
    if (
      sanitized &&
      lowerSanitized !== 'documentos' &&
      lowerSanitized !== 'exercicios' &&
      !lowerCustom.includes(lowerSanitized)
    ) {
      onAddCategoria(sanitized)
      setInputVal('')
    }
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
          <div className="flex items-center gap-2.5 text-foreground">
            <Folder className="w-5 h-5 text-primary" />
            <h3 className="text-base font-black tracking-tight">Gerenciar Categorias</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={lidarComEnvio} className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Nova categoria (ex: provas)"
            className="h-10 px-3 flex-1 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
          <button
            type="submit"
            className="h-10 px-3 bg-primary text-primary-foreground hover:opacity-90 rounded-xl flex items-center justify-center transition-opacity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Categorias Ativas</h4>
          <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden max-h-48 overflow-y-auto">
            <div className="p-3 flex items-center justify-between bg-muted/20 text-xs font-semibold text-muted-foreground">
              <span>{formatarNomeTipo('documentos')}</span>
              <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">Padrão</span>
            </div>
            <div className="p-3 flex items-center justify-between bg-muted/20 text-xs font-semibold text-muted-foreground">
              <span>{formatarNomeTipo('exercicios')}</span>
              <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">Padrão</span>
            </div>
            {customFolders.map(folder => (
              <div key={folder} className="p-3 flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/10 transition-colors">
                <span>{formatarNomeTipo(folder)}</span>
                <button
                  type="button"
                  onClick={() => onDeleteCategoria(folder)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { X, Upload, Check, Loader2 } from 'lucide-react'

interface ModalUploadLocalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  uploadCategory: string
  setUploadCategory: (val: string) => void
  uploadFile: File | null
  setUploadFile: (file: File | null) => void
  listaCategorias: string[]
  enviando: boolean
}

export function ModalUploadLocal({
  isOpen,
  onClose,
  onSubmit,
  uploadCategory,
  setUploadCategory,
  uploadFile,
  setUploadFile,
  listaCategorias,
  enviando
}: ModalUploadLocalProps) {
  if (!isOpen) return null

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'documentos') return 'Documento'
    if (tipo === 'exercicios') return 'Exercício'
    return tipo.charAt(0).toUpperCase() + tipo.slice(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-background border border-border rounded-xl">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Adicionar Arquivo Local</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Salvar arquivo diretamente na pasta da matéria
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Categoria de Destino</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none text-foreground"
              required
            >
              {listaCategorias.map(cat => (
                <option key={cat} value={cat}>{formatarNomeTipo(cat)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Selecionar Arquivo</label>
            <div 
              className={`border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/5 ${uploadFile ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
              onClick={() => document.getElementById('local-file-input')?.click()}
            >
              <input
                id="local-file-input"
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])}
              />
              
              {uploadFile ? (
                <div className="space-y-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full w-fit mx-auto"><Check className="w-6 h-6" /></div>
                  <p className="text-xs font-bold text-foreground text-center truncate px-2">{uploadFile.name}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {(uploadFile.size / 1024).toFixed(1)} KB • Clique para trocar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2 bg-muted rounded-full w-fit mx-auto text-muted-foreground"><Upload className="w-6 h-6" /></div>
                  <p className="text-xs font-bold text-foreground">Clique para selecionar um arquivo</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">O arquivo será salvo na pasta correspondente no disco</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="flex items-center justify-center h-10 px-4 border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={enviando || !uploadFile} className="flex items-center justify-center gap-1.5 h-10 px-5 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-xl text-xs shadow-sm transition-opacity disabled:opacity-50 cursor-pointer">
              {enviando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Enviando...</span></>
              ) : (
                <><Upload className="w-4 h-4" /><span>Adicionar</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

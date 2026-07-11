'use client'

import React from 'react'
import { Search, Plus, RotateCcw } from 'lucide-react'

interface BarraFiltrosCompactaProps {
  searchText: string
  setSearchText: (value: string) => void
  selectedExtension: string
  setSelectedExtension: (value: string) => void
  selectedStatus: string
  setSelectedStatus: (value: string) => void
  mostrarOcultados: boolean
  setMostrarOcultados: (value: boolean) => void
  isFileSystemSupported: boolean
  onLimparFiltros: () => void
  onAdicionarArquivo: () => void
  temFiltrosAtivos: boolean
  desabilitarAdicionar: boolean
}

export function BarraFiltrosCompacta({
  searchText,
  setSearchText,
  selectedExtension,
  setSelectedExtension,
  selectedStatus,
  setSelectedStatus,
  mostrarOcultados,
  setMostrarOcultados,
  isFileSystemSupported,
  onLimparFiltros,
  onAdicionarArquivo,
  temFiltrosAtivos,
  desabilitarAdicionar
}: BarraFiltrosCompactaProps) {
  return (
    <div className="bg-card/30 backdrop-blur-md border border-border/25 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="relative w-full md:w-48">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar arquivo..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 h-8.5 border border-border/30 bg-transparent rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground"
          />
        </div>

        <select
          value={selectedExtension}
          onChange={(e) => setSelectedExtension(e.target.value)}
          className="h-8.5 px-2 border border-border/30 bg-transparent rounded-lg text-[11px] font-bold focus:outline-none text-foreground w-full md:w-auto [&>option]:bg-card"
        >
          <option value="todos">Todos os Formatos</option>
          <option value="pdf">Documentos PDF</option>
          <option value="documento">Texto (Word, TXT)</option>
          <option value="planilha">Planilhas</option>
          <option value="imagem">Imagens</option>
          <option value="video">Vídeos/Gravações</option>
          <option value="codigo">Código Fonte</option>
          <option value="outro">Outros</option>
        </select>

        {isFileSystemSupported && (
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8.5 px-2 border border-border/30 bg-transparent rounded-lg text-[11px] font-bold focus:outline-none text-foreground w-full md:w-auto [&>option]:bg-card"
          >
            <option value="todos">Todos os Status</option>
            <option value="baixados">Baixados</option>
            <option value="pendentes">No Drive</option>
          </select>
        )}

        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-muted-foreground font-bold ml-1">
          <input
            type="checkbox"
            checked={mostrarOcultados}
            onChange={(e) => setMostrarOcultados(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border/30 bg-transparent text-primary focus:ring-primary/20 accent-primary"
          />
          <span>Mostrar Ocultos</span>
        </label>

        {temFiltrosAtivos && (
          <button
            onClick={onLimparFiltros}
            className="h-8.5 px-3 border border-border/30 bg-background/25 hover:bg-muted/40 text-[10px] font-black uppercase tracking-wider rounded-lg text-muted-foreground transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      <button
        onClick={onAdicionarArquivo}
        disabled={desabilitarAdicionar}
        className="flex items-center justify-center gap-1.5 h-8.5 px-4 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-lg text-[11px] shadow-sm transition-opacity disabled:opacity-50 cursor-pointer w-full md:w-auto"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Adicionar Arquivo</span>
      </button>
    </div>
  )
}

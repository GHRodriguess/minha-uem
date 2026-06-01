'use client'

import React, { useState } from 'react'
import { X, Search, Eye, EyeOff } from 'lucide-react'
import { ItemArquivoSidebar } from '@/components/atoms/ItemArquivoSidebar'

interface ArquivoMateriaSimples {
  drive_file_id: string
  original_name: string
  custom_name: string | null
  selected_folder: string
  is_ignored?: boolean
}

interface SidebarArquivosMateriaProps {
  isOpen: boolean
  files: ArquivoMateriaSimples[]
  onOpenFile: (fileId: string, side?: 'left' | 'right') => void
  leftFileId: string | null
  rightFileId: string | null
  onClose: () => void
  onToggleOcultar?: (fileId: string, isIgnored: boolean) => void
  onReorder?: (draggedId: string, targetId: string) => void
}

export function SidebarArquivosMateria({
  isOpen,
  files,
  onOpenFile,
  leftFileId,
  rightFileId,
  onClose,
  onToggleOcultar,
  onReorder
}: SidebarArquivosMateriaProps) {
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [mostrarOcultados, setMostrarOcultados] = useState(false)

  if (!isOpen) return null

  const pdfs = files.filter(f => f.original_name.toLowerCase().endsWith('.pdf'))
  const pdfsFiltrados = pdfs.filter(f => {
    const bateNome = (f.custom_name || f.original_name).toLowerCase().includes(termoPesquisa.toLowerCase())
    const bateOculto = mostrarOcultados ? true : !f.is_ignored
    return bateNome && bateOculto
  })

  const renderizarGrupo = (titulo: string, folderKey: string) => {
    const list = pdfsFiltrados.filter(f => {
      if (folderKey === 'outros') {
        return f.selected_folder !== 'documentos' && f.selected_folder !== 'exercicios'
      }
      return f.selected_folder === folderKey
    })

    if (list.length === 0) return null

    return (
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full w-fit">
          {titulo}
        </span>
        <div className="flex flex-col gap-1.5">
          {list.map(file => (
            <ItemArquivoSidebar
              key={file.drive_file_id}
              file={file}
              onOpenFile={onOpenFile}
              leftFileId={leftFileId}
              rightFileId={rightFileId}
              onToggleOcultar={onToggleOcultar}
              onReorder={onReorder}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 flex flex-col h-full bg-card border-r border-border overflow-y-auto shrink-0 p-4 gap-3.5 scrollbar-thin select-none animate-in slide-in-from-left duration-200">
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Arquivos</h3>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase">{pdfs.length} disponíveis</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 border border-border bg-background hover:bg-muted text-muted-foreground rounded-lg cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filtrar arquivos..."
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="w-full h-8 pl-8 pr-2 border border-border bg-background rounded-xl text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
          <Search className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          onClick={() => setMostrarOcultados(prev => !prev)}
          className={`h-8 w-8 flex items-center justify-center border rounded-xl transition-all cursor-pointer ${
            mostrarOcultados ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background border-border hover:bg-muted text-muted-foreground'
          }`}
          title={mostrarOcultados ? 'Ocultar ignorados' : 'Mostrar ignorados'}
        >
          {mostrarOcultados ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-0.5">
        {pdfsFiltrados.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-6 font-medium">Nenhum PDF encontrado.</p>
        ) : (
          <>
            {renderizarGrupo('Documentos', 'documentos')}
            {renderizarGrupo('Exercícios', 'exercicios')}
            {renderizarGrupo('Outros', 'outros')}
          </>
        )}
      </div>
    </div>
  )
}

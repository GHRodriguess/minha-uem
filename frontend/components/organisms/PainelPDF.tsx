'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ToolbarVisualizador } from '@/components/molecules/ToolbarVisualizador'
import { SidebarMiniaturas } from '@/components/molecules/SidebarMiniaturas'
import { BarraBuscaInterna } from '@/components/molecules/BarraBuscaInterna'
import { usePdfRenderer } from '@/lib/hooks/usePdfRenderer'
import { PaginaPDFIndividual } from '@/components/atoms/PaginaPDFIndividual'

interface PainelPDFProps {
  fileUrl: string | null
  onClose?: () => void
  canClose?: boolean
  onDropFile?: (fileId: string, clientX: number, rect: DOMRect) => void
  onDropLocalFile?: (file: File, clientX: number, rect: DOMRect) => void
  side?: 'left' | 'right'
}

export function PainelPDF({
  fileUrl,
  onClose,
  canClose = false,
  onDropFile,
  onDropLocalFile,
  side = 'left'
}: PainelPDFProps) {
  const containerDePaginasRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const {
    pdfDocument,
    currentPage,
    totalPages,
    scale,
    rotation,
    loading,
    searchTerm,
    matches,
    currentMatchIndex,
    carregarPdf,
    alterarZoom,
    alterarRotacao,
    irParaPagina,
    buscarTexto,
    proximoMatch,
    matchAnterior
  } = usePdfRenderer()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (fileUrl) {
      carregarPdf(fileUrl)
    }
  }, [fileUrl, carregarPdf])

  const navegarParaPagina = useCallback((page: number) => {
    irParaPagina(page)
    const element = document.getElementById(`pdf-${side}-pagina-${page}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [irParaPagina, side])

  useEffect(() => {
    if (currentMatchIndex !== -1 && matches[currentMatchIndex]) {
      const targetPage = matches[currentMatchIndex].page
      const element = document.getElementById(`pdf-${side}-pagina-${targetPage}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [currentMatchIndex, matches, side])

  const renderizarListaPaginas = () => {
    const list = []
    for (let i = 1; i <= totalPages; i++) {
      list.push(
        <div key={i} id={`pdf-${side}-pagina-${i}`} className="w-full flex justify-center shrink-0">
          <PaginaPDFIndividual
            pdfDocument={pdfDocument}
            pageNumber={i}
            scale={scale}
            rotation={rotation}
            onVisible={irParaPagina}
            containerDeScrollRef={containerDePaginasRef}
            searchTerm={searchTerm}
          />
        </div>
      )
    }
    return list
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden relative border border-border/30 rounded-2xl shadow-sm">
      <div className="absolute top-0 left-0 right-0 z-30">
        <ToolbarVisualizador
          sidebarMiniaturesOpen={sidebarOpen}
          onToggleSidebarMiniatures={() => setSidebarOpen(prev => !prev)}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={navegarParaPagina}
          onZoomIn={() => alterarZoom('in')}
          onZoomOut={() => alterarZoom('out')}
          onRotate={alterarRotacao}
          searchActive={searchOpen}
          onToggleSearch={() => setSearchOpen(prev => !prev)}
          onClose={onClose}
          canClose={canClose}
        />

        <BarraBuscaInterna
          isOpen={searchOpen}
          searchTerm={searchTerm}
          onSearchTermChange={buscarTexto}
          onNext={proximoMatch}
          onPrev={matchAnterior}
          currentMatch={currentMatchIndex + 1}
          totalMatches={matches.length}
          onClose={() => {
            setSearchOpen(false)
            buscarTexto('')
          }}
        />
      </div>

      <div className="flex flex-1 h-full overflow-hidden relative">
        <div className="pt-14 h-full shrink-0 flex">
          <SidebarMiniaturas
            isOpen={sidebarOpen}
            pdfDocument={pdfDocument}
            currentPage={currentPage}
            onPageChange={navegarParaPagina}
            totalPages={totalPages}
          />
        </div>

        <div
          ref={containerDePaginasRef}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const rect = e.currentTarget.getBoundingClientRect()
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0]
              if (file.type === 'application/pdf' && onDropLocalFile) {
                onDropLocalFile(file, e.clientX, rect)
              }
              return
            }
            const fileId = e.dataTransfer.getData('text/plain')
            if (fileId && onDropFile) {
              onDropFile(fileId, e.clientX, rect)
            }
          }}
          className={`flex-1 bg-muted/20 overflow-y-auto p-6 pt-20 flex flex-col items-center gap-2 scrollbar-thin transition-all duration-200 ${
            dragOver ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 animate-pulse">
              <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Carregando Documento...
              </span>
            </div>
          ) : !fileUrl ? (
            <div className="flex flex-col items-center justify-center h-64 text-center select-none pt-14">
              <p className="text-xs font-bold text-muted-foreground">Nenhum PDF selecionado</p>
              <p className="text-[10px] text-muted-foreground/80 mt-1">
                Arraste um PDF aqui ou use a barra lateral para carregar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              {renderizarListaPaginas()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

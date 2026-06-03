'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { PainelPDF } from './PainelPDF'
import { DivisorSplitter } from '@/components/atoms/DivisorSplitter'

interface SplitterVisualizacaoProps {
  leftFileUrl: string | null
  rightFileUrl: string | null
  isSplit: boolean
  onCloseLeft: () => void
  onCloseRight: () => void
  onDropFile?: (fileId: string, side: 'left' | 'right') => void
  onDropLocalFile?: (file: File, side: 'left' | 'right') => void
  isDraggingGlobal: boolean
  onCancelDrag: () => void
  isLeftLoading?: boolean
  isRightLoading?: boolean
}

export function SplitterVisualizacao({
  leftFileUrl,
  rightFileUrl,
  isSplit,
  onCloseLeft,
  onCloseRight,
  onDropFile,
  onDropLocalFile,
  isDraggingGlobal,
  onCancelDrag,
  isLeftLoading = false,
  isRightLoading = false
}: SplitterVisualizacaoProps) {
  const [leftWidth, setLeftWidth] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeZone, setActiveZone] = useState<'left' | 'right' | null>(null)

  const lidarComArraste = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newPercent = ((clientX - rect.left) / rect.width) * 100
    setLeftWidth(Math.max(20, Math.min(newPercent, 80)))
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const lidarComMouseMove = (e: MouseEvent) => {
      lidarComArraste(e.clientX)
    }

    const lidarComTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      lidarComArraste(e.touches[0].clientX)
    }

    const finalizarArraste = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
    }

    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', lidarComMouseMove)
    window.addEventListener('mouseup', finalizarArraste)
    window.addEventListener('touchmove', lidarComTouchMove, { passive: true })
    window.addEventListener('touchend', finalizarArraste)

    return () => {
      window.removeEventListener('mousemove', lidarComMouseMove)
      window.removeEventListener('mouseup', finalizarArraste)
      window.removeEventListener('touchmove', lidarComTouchMove)
      window.removeEventListener('touchend', finalizarArraste)
    }
  }, [isDragging, lidarComArraste])

  const iniciarArraste = useCallback(() => {
    setIsDragging(true)
  }, [])

  const lidarComDropInterno = (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault()
    onCancelDrag()
    setActiveZone(null)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf' && onDropLocalFile) {
        onDropLocalFile(file, side)
      }
      return
    }

    const fileId = e.dataTransfer.getData('text/plain')
    if (fileId && onDropFile) {
      onDropFile(fileId, side)
    }
  }

  const renderizarZonasDeDrop = () => {
    if (!isDraggingGlobal) return null

    return (
      <div className="absolute inset-0 z-40 flex w-full h-full p-6 gap-6 bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-200 pointer-events-auto">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setActiveZone('left')}
          onDragLeave={() => setActiveZone(null)}
          onDrop={(e) => lidarComDropInterno(e, 'left')}
          style={{ width: isSplit ? `${leftWidth}%` : '50%' }}
          className={`h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-200 ${
            activeZone === 'left'
              ? 'border-primary bg-primary/10 scale-[0.99] shadow-inner'
              : 'border-muted-foreground/30 bg-card/70'
          }`}
        >
          <span className="text-xs font-black uppercase text-foreground tracking-wider mb-1">
            {isSplit ? 'Substituir na Esquerda' : 'Abrir na Esquerda'}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase">
            Solte o PDF aqui
          </span>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setActiveZone('right')}
          onDragLeave={() => setActiveZone(null)}
          onDrop={(e) => lidarComDropInterno(e, 'right')}
          style={{ width: isSplit ? `${100 - leftWidth}%` : '50%' }}
          className={`h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-200 ${
            activeZone === 'right'
              ? 'border-primary bg-primary/10 scale-[0.99] shadow-inner'
              : 'border-muted-foreground/30 bg-card/70'
          }`}
        >
          <span className="text-xs font-black uppercase text-foreground tracking-wider mb-1">
            {isSplit ? 'Substituir na Direita' : 'Dividir Tela'}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase">
            {isSplit ? 'Solte o PDF aqui' : 'Abrir na Direita'}
          </span>
        </div>
      </div>
    )
  }

  if (!isSplit || !rightFileUrl) {
    return (
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden flex">
        <PainelPDF
          fileUrl={leftFileUrl}
          side="left"
          canClose={leftFileUrl !== null}
          onClose={onCloseLeft}
          isLoading={isLeftLoading}
        />
        {renderizarZonasDeDrop()}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 w-full h-full overflow-hidden select-none relative"
    >
      <div style={{ width: `${leftWidth}%` }} className="h-full overflow-hidden flex shrink-0">
        <PainelPDF
          fileUrl={leftFileUrl}
          side="left"
          canClose={leftFileUrl !== null}
          onClose={onCloseLeft}
          isLoading={isLeftLoading}
        />
      </div>

      <DivisorSplitter
        onMouseDown={iniciarArraste}
        onTouchStart={iniciarArraste}
        onDoubleClick={() => setLeftWidth(50)}
      />

      <div style={{ width: `${100 - leftWidth}%` }} className="h-full overflow-hidden flex flex-1">
        <PainelPDF
          fileUrl={rightFileUrl}
          side="right"
          canClose={rightFileUrl !== null}
          onClose={onCloseRight}
          isLoading={isRightLoading}
        />
      </div>

      {renderizarZonasDeDrop()}
    </div>
  )
}

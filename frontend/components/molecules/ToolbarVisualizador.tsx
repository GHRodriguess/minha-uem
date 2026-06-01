'use client'

import React from 'react'
import {
  Sidebar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  X
} from 'lucide-react'
import { BotaoVisualizador } from '@/components/atoms/BotaoVisualizador'
import { IndicadorPagina } from '@/components/atoms/IndicadorPagina'

interface ToolbarVisualizadorProps {
  sidebarMiniaturesOpen: boolean
  onToggleSidebarMiniatures: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onRotate: () => void
  searchActive: boolean
  onToggleSearch: () => void
  onClose?: () => void
  canClose?: boolean
}

export function ToolbarVisualizador({
  sidebarMiniaturesOpen,
  onToggleSidebarMiniatures,
  currentPage,
  totalPages,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onRotate,
  searchActive,
  onToggleSearch,
  onClose,
  canClose = false
}: ToolbarVisualizadorProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-20 shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        <BotaoVisualizador
          icon={Sidebar}
          onClick={onToggleSidebarMiniatures}
          title={sidebarMiniaturesOpen ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
          isActive={sidebarMiniaturesOpen}
        />
        <div className="w-px h-6 bg-border/40 mx-1 hidden sm:block" />
        <IndicadorPagina
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <BotaoVisualizador
          icon={ZoomOut}
          onClick={onZoomOut}
          title="Diminuir zoom"
        />
        <BotaoVisualizador
          icon={ZoomIn}
          onClick={onZoomIn}
          title="Aumentar zoom"
        />
        <div className="w-px h-6 bg-border/40 mx-1" />
        <BotaoVisualizador
          icon={RotateCw}
          onClick={onRotate}
          title="Rotacionar 90°"
        />
        <BotaoVisualizador
          icon={Search}
          onClick={onToggleSearch}
          title="Buscar no PDF"
          isActive={searchActive}
        />
        {canClose && onClose && (
          <>
            <div className="w-px h-6 bg-border/40 mx-1" />
            <BotaoVisualizador
              icon={X}
              onClick={onClose}
              title="Fechar visualizador"
            />
          </>
        )}
      </div>
    </div>
  )
}

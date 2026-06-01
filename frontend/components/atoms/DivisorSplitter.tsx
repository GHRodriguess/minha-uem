'use client'

import React from 'react'

interface DivisorSplitterProps {
  onMouseDown: (e: React.MouseEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
  onDoubleClick: () => void
}

export function DivisorSplitter({
  onMouseDown,
  onTouchStart,
  onDoubleClick
}: DivisorSplitterProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      className="hidden md:flex flex-col items-center justify-center w-3 hover:w-4 bg-background border-l border-r border-border hover:bg-muted cursor-col-resize select-none transition-all duration-200 group relative z-10 shrink-0 h-full"
      title="Arraste para redimensionar, duplo clique para centralizar"
    >
      <div className="w-1 h-8 bg-muted-foreground/30 hover:bg-muted-foreground/60 rounded-full transition-colors group-hover:scale-y-125" />
    </div>
  )
}

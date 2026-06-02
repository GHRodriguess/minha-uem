'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface BotaoVisualizadorProps {
  icon: LucideIcon
  onClick: () => void
  title: string
  isActive?: boolean
  isDisabled?: boolean
}

export function BotaoVisualizador({
  icon: Icone,
  onClick,
  title,
  isActive = false,
  isDisabled = false
}: BotaoVisualizadorProps) {
  const baseStyle = 'p-1.5 sm:p-2 rounded-xl transition-all duration-200 shrink-0 border backdrop-blur-md'
  const activeStyle = isActive
    ? 'bg-primary/20 text-primary border-primary/30 shadow-sm'
    : 'bg-background/60 hover:bg-background/80 text-foreground border-border/40'
  const disabledStyle = isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      className={`${baseStyle} ${activeStyle} ${disabledStyle}`}
      title={title}
      disabled={isDisabled}
    >
      <Icone className="w-4 h-4" />
    </button>
  )
}

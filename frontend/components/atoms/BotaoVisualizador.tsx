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
  const baseStyle = 'p-2 rounded-xl transition-all duration-200 shrink-0 border'
  const activeStyle = isActive
    ? 'bg-primary/10 text-primary border-primary/25 shadow-sm'
    : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
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

'use client'

import * as React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SinoNotificacoesProps {
  count: number
  onClick?: () => void
}

export default function SinoNotificacoes({ count, onClick }: SinoNotificacoesProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative hover:bg-muted"
      title="Notificações do Classroom"
    >
      <Bell className="h-[1.2rem] w-[1.2rem] text-muted-foreground hover:text-foreground transition-colors" />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-destructive-foreground animate-pulse leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
      <span className="sr-only">Notificações</span>
    </Button>
  )
}

'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface PropriedadesBotao {
  href: string
  children: ReactNode
  variante?: 'primaria' | 'secundaria' | 'outline'
  className?: string
}

export default function BotaoLanding({
  href,
  children,
  variante = 'primaria',
  className
}: PropriedadesBotao) {
  const classesVariante = {
    primaria: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98]',
    secundaria: 'bg-secondary text-secondary-foreground hover:bg-muted active:scale-[0.98]',
    outline: 'border border-border text-foreground hover:bg-muted active:scale-[0.98]'
  }

  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform select-none cursor-pointer",
        classesVariante[variante],
        className
      )}
    >
      {children}
    </Link>
  )
}

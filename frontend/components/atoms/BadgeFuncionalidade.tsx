'use client'

import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface PropriedadesBadge {
  children: ReactNode
  className?: string
}

export default function BadgeFuncionalidade({ children, className }: PropriedadesBadge) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase select-none animate-pulse",
        className
      )}
    >
      {children}
    </span>
  )
}

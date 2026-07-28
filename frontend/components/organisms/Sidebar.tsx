'use client'

import { LayoutDashboard, BookOpen, Calendar, Shield, Sparkles, CheckSquare } from 'lucide-react'
import ItemNavegacao from '../molecules/ItemNavegacao'
import BotaoNovoHorario from '../molecules/BotaoNovoHorario'
import { usePathname } from 'next/navigation'
import { useClassroom } from '../providers/ProvedorClassroom'
import { useSuporte } from '../providers/ProvedorSuporte'
import { clsx } from 'clsx'

interface SidebarProps {
  className?: string
  isMobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ className, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { notificationsCount } = useClassroom()
  const { usuarioMe, notificacoesAdmin } = useSuporte()

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Início' },
    { href: '/disciplinas', icon: BookOpen, label: 'Disciplinas' },
    { href: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
    { href: '/ia', icon: Sparkles, label: 'Assistente IA' },
    { href: '/horarios', icon: Calendar, label: 'Calendário' },
  ]

  if (usuarioMe?.is_staff) {
    links.splice(4, 0, { href: '/admin', icon: Shield, label: 'Administração' })
  }

  return (
    <aside className={clsx(
      "w-64 h-screen bg-card border-r border-border flex flex-col p-6 sticky top-0 z-30",
      isMobile && "h-full border-r-0 p-0 static w-full",
      className
    )}>
      <nav className="flex-1 space-y-2 pt-2">
        {links.map((link) => {
          const isDisciplinas = link.href === '/disciplinas'
          const isAdmin = link.href === '/admin'

          let contagemBadge = 0
          if (isDisciplinas) contagemBadge = notificationsCount
          if (isAdmin) contagemBadge = notificacoesAdmin

          const showBadge = contagemBadge > 0

          return (
            <ItemNavegacao
              key={link.href}
              {...link}
              active={pathname === link.href}
              onClick={isMobile ? onClose : undefined}
              badge={showBadge ? (
                <span className={clsx(
                  "flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-black leading-none",
                  pathname === link.href
                    ? "bg-primary-foreground text-primary"
                    : "bg-destructive text-destructive-foreground animate-pulse"
                )}>
                  {contagemBadge}
                </span>
              ) : undefined}
            />
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50">
        <BotaoNovoHorario onSuccess={isMobile ? onClose : undefined} />
      </div>
    </aside>
  )
}

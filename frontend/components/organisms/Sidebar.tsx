'use client'

import { LayoutDashboard, BookOpen, Calendar, LogOut, PlusCircle, Settings, X, LifeBuoy, Shield, Newspaper } from 'lucide-react'
import Logo from '../atoms/Logo'
import ItemNavegacao from '../molecules/ItemNavegacao'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import CardUploadPDF from './CardUploadPDF'
import { useClassroom } from '../providers/ProvedorClassroom'
import { useSuporte } from '../providers/ProvedorSuporte'
import { suporte_servico } from '@/lib/api/suporte'
import { clsx } from 'clsx'

interface SidebarProps {
  className?: string
  isMobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ className, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [modalAberto, setModalAberto] = useState(false)
  const { notificationsCount } = useClassroom()
  const { usuarioMe, notificacoesUsuario, notificacoesAdmin } = useSuporte()
  const [latestNewsId, setLatestNewsId] = useState<number | null>(null)

  useEffect(() => {
    const token = session?.accessToken
    if (!token) return
    const verificarNoticias = async () => {
      try {
        const list = await suporte_servico.listarNoticias(token)
        if (list.length > 0) {
          const maxId = Math.max(...list.map(n => n.id))
          setLatestNewsId(maxId)
        }
      } catch {
      }
    }
    verificarNoticias()
    const interval = setInterval(verificarNoticias, 60000)
    return () => clearInterval(interval)
  }, [session?.accessToken])

  const handleSair = () => {
    signOut({ callbackUrl: '/login' })
  }

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Início' },
    { href: '/disciplinas', icon: BookOpen, label: 'Disciplinas' },
    { href: '/horarios', icon: Calendar, label: 'Calendário' },
    { href: '/noticias', icon: Newspaper, label: 'Notícias' },
    { href: '/suporte', icon: LifeBuoy, label: 'Suporte' },
    { href: '/configuracoes', icon: Settings, label: 'Configurações' },
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
      <div className="mb-10 flex items-center justify-between">
        <Logo />
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const isDisciplinas = link.href === '/disciplinas'
          const isSuporte = link.href === '/suporte'
          const isAdmin = link.href === '/admin'
          const isNoticias = link.href === '/noticias'

          let contagemBadge = 0
          if (isDisciplinas) contagemBadge = notificationsCount
          if (isSuporte) contagemBadge = notificacoesUsuario
          if (isAdmin) contagemBadge = notificacoesAdmin

          let showBadge = contagemBadge > 0
          if (isNoticias) {
            const lastRead = typeof window !== 'undefined' ? localStorage.getItem('lastReadNewsId') : null
            if (latestNewsId && (!lastRead || parseInt(lastRead) < latestNewsId)) {
              showBadge = true
            }
          }

          return (
            <ItemNavegacao
              key={link.href}
              {...link}
              active={pathname === link.href}
              onClick={onClose}
              badge={showBadge ? (
                <span className={clsx(
                  "flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-black leading-none",
                  pathname === link.href 
                    ? "bg-primary-foreground text-primary" 
                    : "bg-destructive text-destructive-foreground animate-pulse"
                )}>
                  {isNoticias ? "!" : contagemBadge}
                </span>
              ) : undefined}
            />
          )
        })}
      </nav>
    
      <div className="">
        <Button 
          onClick={() => {
            setModalAberto(true)
          }}
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl px-4 py-3 h-auto font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
        >
          <PlusCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
          <span>Novo Horário</span>
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={() => {
          handleSair()
          if (isMobile && onClose) onClose()
        }}
        className="justify-start gap-3 px-4 py-6 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sair</span>
      </Button>

      <Modal 
        isOpen={modalAberto}         
        onClose={() => setModalAberto(false)}
        title="Inserir Novo Horário"
      >
        <div className="p-1">
          <CardUploadPDF 
            token={session?.accessToken || ''}
            onSuccess={() => {
              setModalAberto(false)
              if (isMobile && onClose) onClose()
            }}
          />
        </div>
      </Modal>
    </aside>
  )
}

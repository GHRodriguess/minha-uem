'use client'

import { LayoutDashboard, BookOpen, GraduationCap, Calendar, LogOut, PlusCircle, Settings } from 'lucide-react'
import Logo from '../atoms/Logo'
import ItemNavegacao from '../molecules/ItemNavegacao'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Modal from '../shared/Modal'
import CardUploadPDF from './CardUploadPDF'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [modalAberto, setModalAberto] = useState(false)

  const handleSair = () => {
    signOut({ callbackUrl: '/login' })
  }

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Início' },
    { href: '/disciplinas', icon: BookOpen, label: 'Disciplinas' },
    { href: '/curso', icon: GraduationCap, label: 'Curso' },
    { href: '/horarios', icon: Calendar, label: 'Calendário' },
    { href: '/configuracoes', icon: Settings, label: 'Configurações' },
  ]

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col p-6 sticky top-0">
      <div className="mb-10">
        <Logo />
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <ItemNavegacao
            key={link.href}
            {...link}
            active={pathname === link.href}
          />
        ))}
      </nav>
    
      <div className="">
        <Button 
          onClick={() => setModalAberto(true)}
          variant='ghost'
          className="w-full justify-start gap-3 rounded-xl py-6 font-bold"
        >
          <PlusCircle className="w-5 h-5" />
          Novo Horário
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={handleSair}
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
            onSuccess={() => setModalAberto(false)}
          />
        </div>
      </Modal>
    </aside>
  )
}

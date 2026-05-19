'use client'

import { LayoutDashboard, BookOpen, GraduationCap, Calendar, LogOut } from 'lucide-react'
import Logo from '../atoms/Logo'
import ItemNavegacao from '../molecules/ItemNavegacao'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Sidebar() {
  const pathname = usePathname()

  const handleSair = () => {
    signOut({ callbackUrl: '/login' })
  }

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Início' },
    { href: '/disciplinas', icon: BookOpen, label: 'Disciplinas' },
    { href: '/curso', icon: GraduationCap, label: 'Curso' },
    { href: '/horarios', icon: Calendar, label: 'Horários' },
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

      <Button
        variant="ghost"
        onClick={handleSair}
        className="justify-start gap-3 px-4 py-6 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sair</span>
      </Button>
    </aside>
  )
}

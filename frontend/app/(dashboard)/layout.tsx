'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/organisms/Sidebar'
import Topbar from '@/components/organisms/Topbar'
import { useSuporte } from '@/components/providers/ProvedorSuporte'
import BotaoFlutuanteIA from '@/components/atoms/BotaoFlutuanteIA'
import SidebarChatIA from '@/components/organisms/SidebarChatIA'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { isImpersonating, impersonatedUserName, encerrarSimulacao } = useSuporte()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && !session?.accessToken) {
      signOut({ callbackUrl: '/login?error=BackendError' })
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && !session?.accessToken)) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      <Sidebar className="hidden lg:flex" />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-card border-r border-border h-full p-6 animate-in slide-in-from-left duration-300 z-50">
            <Sidebar isMobile onClose={() => setIsSidebarOpen(false)} className="h-full border-r-0 p-0 static" />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {isImpersonating && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-3 shrink-0 transition-all z-50 animate-in slide-in-from-top duration-300">
            <span>Modo Simulação Ativo: Visualizando como {impersonatedUserName}</span>
            <button
              onClick={encerrarSimulacao}
              className="bg-background text-foreground hover:bg-background/90 px-3 py-1 rounded-xl transition-all font-bold text-[10px] uppercase shadow-sm"
            >
              Encerrar Simulação
            </button>
          </div>
        )}
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {pathname !== null && !pathname.includes('/arquivos/visualizador') && (
        <>
          <BotaoFlutuanteIA onClick={() => setIsChatOpen(!isChatOpen)} isOpen={isChatOpen} />
          <SidebarChatIA isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
      )}
    </div>
  )
}


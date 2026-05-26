'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSuporte } from '@/components/providers/ProvedorSuporte'
import { suporte_servico, EstatisticasAdmin, UsuarioAdminDet } from '@/lib/api/suporte'
import { BarChart3, HelpCircle, Users } from 'lucide-react'
import { clsx } from 'clsx'
import VisualizadorEstatisticas from '@/components/organisms/VisualizadorEstatisticas'
import GerenciadorSuporteAdmin from '@/components/organisms/GerenciadorSuporteAdmin'
import TabelaUsuariosAdmin from '@/components/organisms/TabelaUsuariosAdmin'

export default function AdminPage() {
  const { data: session } = useSession()
  const { usuarioMe, carregandoMe } = useSuporte()
  const [abaAtiva, setAbaAtiva] = useState<'estatisticas' | 'usuarios' | 'suporte'>('estatisticas')
  const [estatisticas, setEstatisticas] = useState<EstatisticasAdmin | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioAdminDet[]>([])

  useEffect(() => {
    if (!session?.accessToken || !usuarioMe?.is_staff) return
    
    if (abaAtiva === 'estatisticas') {
      suporte_servico.obterEstatisticasAdmin(session.accessToken)
        .then(setEstatisticas)
        .catch(err => console.error('Erro ao carregar estatisticas:', err))
    } else if (abaAtiva === 'usuarios') {
      suporte_servico.listarUsuariosAdmin(session.accessToken)
        .then(setUsuarios)
        .catch(err => console.error('Erro ao listar usuarios:', err))
    }
  }, [session?.accessToken, usuarioMe, abaAtiva])

  if (carregandoMe) {
    return (
      <div className="h-96 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!usuarioMe?.is_staff) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-card border border-border rounded-2xl text-center space-y-3">
        <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-sm text-muted-foreground">Esta área é reservada exclusivamente para administradores do sistema.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Painel de Administração</h1>
        <p className="text-sm text-muted-foreground">Monitore o uso da plataforma e responda aos chamados pendentes.</p>
      </div>

      <div className="flex border-b border-border gap-6 shrink-0 overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('estatisticas')}
          className={clsx(
            "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 shrink-0",
            abaAtiva === 'estatisticas' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Estatísticas</span>
        </button>
        <button
          onClick={() => setAbaAtiva('usuarios')}
          className={clsx(
            "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 shrink-0",
            abaAtiva === 'usuarios' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Usuários Ativos</span>
        </button>
        <button
          onClick={() => setAbaAtiva('suporte')}
          className={clsx(
            "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all duration-200 shrink-0",
            abaAtiva === 'suporte' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Gerenciar Suporte</span>
        </button>
      </div>

      <div className="transition-all duration-300">
        {abaAtiva === 'estatisticas' && <VisualizadorEstatisticas estatisticas={estatisticas} />}
        {abaAtiva === 'usuarios' && (
          <TabelaUsuariosAdmin 
            usuarios={usuarios} 
            onUsuarioAlterado={() => {
              if (session?.accessToken) {
                suporte_servico.listarUsuariosAdmin(session.accessToken)
                  .then(setUsuarios)
                  .catch(err => console.error(err))
              }
            }} 
          />
        )}
        {abaAtiva === 'suporte' && <GerenciadorSuporteAdmin />}
      </div>
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { classroom_service, ConfiguracaoClassroom } from '@/lib/api/classroom'
import { 
  Settings, 
  User, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  FolderSync,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import AvatarUsuario from '@/components/atoms/AvatarUsuario'
import { useClassroom } from '@/components/providers/ProvedorClassroom'

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ConfiguracaoClassroom>({
    download_dir: '',
    folder_options: ''
  })

  const {
    directoryHandle,
    hasFolderPermission,
    isFileSystemSupported,
    solicitarAcessoPasta,
    desvincularPasta
  } = useClassroom()

  const carregarConfig = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      const data = await classroom_service.obterConfiguracao(session.accessToken)
      setConfig(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    carregarConfig()
  }, [carregarConfig])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Configurações</h1>
        </div>
        <p className="text-muted-foreground font-medium">Gerencie seu perfil e preferências do sistema</p>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Informações do Perfil</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dados da conta institucional</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-background ring-2 ring-primary/20 overflow-hidden shadow-xl">
                 <AvatarUsuario 
                   src={session?.user?.image} 
                   alt={session?.user?.name}
                   className="w-full h-full object-cover"
                 />
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome Completo</label>
                <div className="h-12 px-4 rounded-xl bg-muted/30 border border-border flex items-center text-sm font-bold text-foreground opacity-70 cursor-not-allowed">
                  {session?.user?.name}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail Institucional</label>
                <div className="h-12 px-4 rounded-xl bg-muted/30 border border-border flex items-center text-sm font-bold text-foreground opacity-70 cursor-not-allowed">
                  {session?.user?.email}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
              As informações de perfil são sincronizadas automaticamente com sua conta do Google Workspace da UEM e não podem ser alteradas diretamente neste sistema.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Sincronização Local (Modo Offline)</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Configurações de salvamento local e visualização offline</p>
            </div>
          </div>

          <div className="space-y-6">
            {!isFileSystemSupported ? (
              <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-6 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Navegador Não Suportado</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Seu navegador atual não suporta a API de Acesso ao Sistema de Arquivos (File System Access API). 
                    Para habilitar a sincronização inteligente de arquivos e o download offline direto, 
                    utilize um navegador baseado em Chromium (como Google Chrome, Microsoft Edge ou Brave) no Desktop.
                  </p>
                </div>
              </div>
            ) : !directoryHandle ? (
              <div className="bg-muted/30 border border-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Status: Desativado</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Vincule uma pasta local do seu computador para salvar seus materiais e acessá-los offline instantaneamente.
                  </p>
                </div>
                <Button 
                  onClick={solicitarAcessoPasta}
                  className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs gap-2 shrink-0 w-full md:w-auto"
                >
                  <FolderOpen className="w-4 h-4" />
                  Vincular Pasta
                </Button>
              </div>
            ) : !hasFolderPermission ? (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Permissão Temporária Expirada</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      A pasta <span className="font-bold text-primary">{directoryHandle.name}</span> está vinculada, mas o navegador requer que você conceda permissão de leitura/escrita para esta sessão.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
                  <Button 
                    onClick={solicitarAcessoPasta}
                    className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs gap-2 flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Conceder Acesso
                  </Button>
                  <Button 
                    onClick={desvincularPasta}
                    variant="outline"
                    className="h-12 px-6 rounded-xl font-bold text-xs gap-2 flex-1 border-dashed"
                  >
                    Desvincular Pasta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Status: Ativo e Sincronizado</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      Os materiais serão salvos e organizados automaticamente no diretório:<br/>
                      <span className="font-mono text-primary font-bold">{directoryHandle.name}/UEM/Cursos/{"{Curso}"}/{"{ano}"}/{"{materia}"}/...</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <FolderSync className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pronto para uso offline</span>
                  </div>
                  <Button 
                    onClick={desvincularPasta}
                    variant="outline"
                    className="h-11 px-6 rounded-xl font-bold text-xs gap-2 border-dashed w-full sm:w-auto"
                  >
                    Desvincular Pasta
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl">
              <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                A pasta vinculada é gerida de forma 100% segura através do seu próprio navegador usando a API padrão da Web (sem envios para servidores externos). 
                Isso garante acesso rápido e offline instantâneo a todos os seus documentos de estudo da UEM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

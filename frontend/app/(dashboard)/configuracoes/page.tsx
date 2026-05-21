'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { classroom_service, ConfiguracaoClassroom, ItemDiretorio } from '@/lib/api/classroom'
import { 
  Settings, 
  User, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Save,
  HardDrive,
  Folder,
  ChevronRight,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AvatarUsuario from '@/components/atoms/AvatarUsuario'
import Modal from '@/components/shared/Modal'

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null)
  
  const [config, setConfig] = useState<ConfiguracaoClassroom>({
    download_dir: '',
    folder_options: ''
  })

  // Estados do Seletor de Pastas
  const [modalSeletorAberto, setModalSeletorAberto] = useState(false)
  const [caminhoAtual, setAtualPath] = useState('')
  const [itensDiretorio, setItens] = useState<ItemDiretorio[]>([])
  const [loadingPastas, setLoadingPastas] = useState(false)

  const carregarConfig = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      const data = await classroom_service.obterConfiguracao(session.accessToken)
      setConfig(data)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    carregarConfig()
  }, [carregarConfig])

  const explorarCaminho = async (path?: string) => {
    if (!session?.accessToken) return
    setLoadingPastas(true)
    try {
      const res = await classroom_service.explorarDiretorios(session.accessToken, path)
      setAtualPath(res.atual)
      setItens(res.itens)
    } catch (error) {
      console.error('Erro ao explorar diretórios:', error)
    } finally {
      setLoadingPastas(false)
    }
  }

  const abrirSeletor = () => {
    setModalSeletorAberto(true)
    // Tenta carregar o caminho atual, mas o backend agora está protegido para falhas
    explorarCaminho(config.download_dir || undefined)
  }

  const selecionarPasta = (path: string) => {
    setConfig(prev => ({ ...prev, download_dir: path }))
    setModalSeletorAberto(false)
  }

  const handleSalvar = async () => {
    if (!session?.accessToken) return
    setSaving(true)
    setMensagem(null)
    try {
      await classroom_service.atualizarConfiguracao(session.accessToken, {
        download_dir: config.download_dir
      })
      setMensagem({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso!' })
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar configurações.' })
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

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
        {/* Seção de Perfil */}
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

        {/* Seção de Downloads */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Preferências de Download</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Configurações de salvamento local</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="download-dir" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Diretório de Salvamento Raiz
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <Input
                    id="download-dir"
                    className="h-12 pl-11 rounded-xl bg-background border-border font-bold focus-visible:ring-primary/20"
                    value={config.download_dir}
                    onChange={(e) => setConfig({ ...config, download_dir: e.target.value })}
                    placeholder="Ex: /Users/usuario/Downloads"
                  />
                </div>
                <Button 
                  onClick={abrirSeletor}
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-bold border-dashed border-2 gap-2 hover:bg-primary/5 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Procurar
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                Os arquivos serão organizados automaticamente seguindo o padrão:<br/>
                <span className="font-bold text-primary">{config.download_dir || 'Downloads/MinhaUEM'}/UEM/{"{Curso}"}/Materias/{"{Ano}"}/{"{Materia}"}/[documentos|exercicios]</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
              <div className="flex-1">
                {mensagem && (
                  <div className={`flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-left-2 ${mensagem.tipo === 'sucesso' ? 'text-green-500' : 'text-destructive'}`}>
                    {mensagem.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {mensagem.texto}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleSalvar}
                disabled={saving}
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal do Seletor de Pastas */}
      <Modal
        isOpen={modalSeletorAberto}
        onClose={() => setModalSeletorAberto(false)}
        title="Selecionar Diretório"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border text-[11px] font-bold text-muted-foreground break-all">
            <Folder className="w-3.5 h-3.5 shrink-0" />
            {caminhoAtual || 'Carregando...'}
          </div>

          <div className="max-h-87.5 overflow-y-auto border border-border rounded-2xl bg-card">
            {loadingPastas ? (
              <div className="p-12 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Acessando sistema...</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {itensDiretorio.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => explorarCaminho(item.path)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.nome === '..' ? 'bg-muted' : 'bg-primary/10'}`}>
                        <Folder className={`w-4 h-4 ${item.nome === '..' ? 'text-muted-foreground' : 'text-primary'}`} />
                      </div>
                      <span className={`text-sm font-bold ${item.nome === '..' ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {item.nome}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                {itensDiretorio.length === 0 && !loadingPastas && (
                  <div className="p-12 text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nenhuma pasta encontrada neste nível</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                Pasta Selecionada: <span className="text-primary">{caminhoAtual || '/'}</span>
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <Button 
                variant="ghost" 
                onClick={() => setModalSeletorAberto(false)}
                className="flex-1 sm:flex-initial h-10 px-6 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => selecionarPasta(caminhoAtual)}
                className="flex-1 sm:flex-initial h-10 px-8 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Confirmar Local
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

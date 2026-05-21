'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { 
  classroom_service, 
  ConfiguracaoClassroom, 
  ArquivoClassroom, 
  StatusVinculoClassroom 
} from '@/lib/api/classroom'
import { 
  School, 
  RefreshCw, 
  Download, 
  Edit2, 
  Check, 
  X, 
  Folder, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileText,
  Filter,
  ArrowUpDown,
  Layers
} from 'lucide-react'

interface CardClassroomProps {
  materiaId: number
  anoId: number
}

type OrdenacaoArquivo = 'nome' | 'recentes'
type AgrupamentoArquivo = 'nenhum' | 'tipo' | 'status'

export function CardClassroom({ materiaId, anoId }: CardClassroomProps) {
  const { data: session } = useSession()
  
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  
  const [statusVinculo, setStatusVinculo] = useState<StatusVinculoClassroom>({
    vinculado: false,
    arquivos: []
  })
  
  const [configClassroom, setConfigClassroom] = useState<ConfiguracaoClassroom>({
    download_dir: 'Downloads/MinhaUEM',
    folder_options: 'documentos,exercicios'
  })
  
  const [ordenacao, setOrdenacao] = useState<OrdenacaoArquivo>('nome')
  const [agrupamento, setAgrupamento] = useState<AgrupamentoArquivo>('nenhum')

  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [customNameInput, setCustomNameInput] = useState('')

  const obterDados = useCallback(async (exibirSyncLoader: boolean = false) => {
    if (!session?.accessToken) return
    
    if (exibirSyncLoader) {
      setSyncing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const googleToken = session.googleAccessToken || null
      const vinculo = await classroom_service.obterArquivos(
        session.accessToken, 
        googleToken, 
        materiaId, 
        anoId
      )
      setStatusVinculo(vinculo)
      
      const config = await classroom_service.obterConfiguracao(session.accessToken)
      setConfigClassroom(config)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [session, materiaId, anoId])

  useEffect(() => {
    obterDados()
  }, [obterDados])

  const iniciarEdicaoNome = (arquivo: ArquivoClassroom) => {
    setEditingFileId(arquivo.drive_file_id)
    setCustomNameInput(arquivo.custom_name || arquivo.original_name)
  }

  const salvarNomePersonalizado = async (driveFileId: string, originalName: string) => {
    if (!session?.accessToken) return
    try {
      const atualizado = await classroom_service.atualizarArquivo(
        session.accessToken, 
        driveFileId, 
        materiaId, 
        anoId, 
        originalName, 
        { custom_name: customNameInput.trim() || null }
      )
      
      setStatusVinculo(prev => ({
        ...prev,
        arquivos: prev.arquivos.map(a => a.drive_file_id === driveFileId ? { 
          ...a, 
          id: atualizado.id,
          custom_name: atualizado.custom_name 
        } : a)
      }))
      
      setEditingFileId(null)
    } catch (error) {
      console.error(error)
    }
  }

  const salvarPastaDestino = async (driveFileId: string, originalName: string, pasta: string) => {
    if (!session?.accessToken) return
    try {
      const atualizado = await classroom_service.atualizarArquivo(
        session.accessToken, 
        driveFileId, 
        materiaId, 
        anoId, 
        originalName, 
        { selected_folder: pasta }
      )
      
      setStatusVinculo(prev => ({
        ...prev,
        arquivos: prev.arquivos.map(a => a.drive_file_id === driveFileId ? { 
          ...a, 
          id: atualizado.id,
          selected_folder: atualizado.selected_folder 
        } : a)
      }))
    } catch (error) {
      console.error(error)
    }
  }

  const baixarItem = async (driveFileId: string, originalName: string) => {
    if (!session?.accessToken || !session.googleAccessToken) return
    setDownloadingId(driveFileId)
    try {
      const baixado = await classroom_service.baixarArquivo(
        session.accessToken,
        session.googleAccessToken,
        driveFileId,
        materiaId,
        anoId,
        originalName
      )
      
      setStatusVinculo(prev => ({
        ...prev,
        arquivos: prev.arquivos.map(a => a.drive_file_id === driveFileId ? { 
          ...a, 
          id: baixado.id,
          is_downloaded: baixado.is_downloaded, 
          local_path: baixado.local_path 
        } : a)
      }))
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro ao baixar o arquivo do Google Drive. Verifique suas credenciais.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Sincronizando Classroom...</p>
      </div>
    )
  }

  if (!session?.googleAccessToken) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-bold">Google Classroom</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Conecte-se com seu e-mail institucional @uem.br para acessar os materiais da turma.
        </p>
      </div>
    )
  }

  const listaCategorias = configClassroom.folder_options.split(',').map(c => c.trim()).filter(Boolean)

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'documentos') return 'Documento'
    if (tipo === 'exercicios') return 'Exercício'
    return tipo.charAt(0).toUpperCase() + tipo.slice(1)
  }

  // Lógica de Processamento de Arquivos
  const arquivosProcessados = [...statusVinculo.arquivos].sort((a, b) => {
    if (ordenacao === 'nome') {
      const nameA = a.custom_name || a.original_name
      const nameB = b.custom_name || b.original_name
      return nameA.localeCompare(nameB)
    } else {
      const dateA = a.sync_at ? new Date(a.sync_at).getTime() : 0
      const dateB = b.sync_at ? new Date(b.sync_at).getTime() : 0
      return dateB - dateA
    }
  })

  const renderizarLista = (arquivos: ArquivoClassroom[]) => (
    <div className="flex flex-col gap-2">
      {arquivos.map((arquivo) => {
        const estaEditando = editingFileId === arquivo.drive_file_id
        const estaBaixando = downloadingId === arquivo.drive_file_id

        return (
          <div 
            key={arquivo.drive_file_id} 
            className={`flex flex-col gap-3 p-4 border border-border rounded-2xl bg-card transition-all duration-200 ${arquivo.is_downloaded ? 'opacity-70 grayscale-[0.5]' : 'hover:border-primary/30 shadow-sm'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${arquivo.is_downloaded ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <FileText className="w-4 h-4" />
              </div>
              
              <div className="space-y-1 min-w-0 flex-1">
                {estaEditando ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      className="h-7 px-2 border border-border rounded-md bg-background text-[11px] font-bold w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={customNameInput}
                      onChange={(e) => setCustomNameInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => salvarNomePersonalizado(arquivo.drive_file_id, arquivo.original_name)}
                      className="p-1 rounded bg-emerald-500 text-white hover:opacity-90"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingFileId(null)}
                      className="p-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <p className="text-xs font-bold text-foreground leading-tight truncate">
                      {arquivo.custom_name || arquivo.original_name}
                    </p>
                    <button
                      onClick={() => iniciarEdicaoNome(arquivo)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {arquivo.custom_name && (
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide truncate max-w-[120px]">
                      Original: {arquivo.original_name}
                    </p>
                  )}
                  
                  {arquivo.is_downloaded && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Baixado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
              <select
                className="h-8 px-2 border border-border rounded-lg bg-background text-[10px] font-bold focus:outline-none w-28"
                value={arquivo.selected_folder}
                onChange={(e) => salvarPastaDestino(arquivo.drive_file_id, arquivo.original_name, e.target.value)}
              >
                {listaCategorias.map((cat) => (
                  <option key={cat} value={cat}>
                    Tipo: {formatarNomeTipo(cat)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => baixarItem(arquivo.drive_file_id, arquivo.original_name)}
                disabled={estaBaixando}
                className={`flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${arquivo.is_downloaded ? 'border border-border bg-muted/50 text-muted-foreground hover:bg-muted' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'} disabled:opacity-50`}
              >
                {estaBaixando ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                {arquivo.is_downloaded ? 'Re-baixar' : 'Baixar'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )

  if (!statusVinculo.vinculado) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 px-4">
          <p className="text-sm font-bold text-foreground">Turma não vinculada</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Nenhuma turma correspondente foi encontrada no Google Classroom.
          </p>
        </div>
        <button
          onClick={() => obterDados()}
          className="flex items-center gap-2 mx-auto h-9 px-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors text-xs font-bold text-muted-foreground"
        >
          <RefreshCw className="w-3 h-3" />
          Sincronizar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Agrupar:</span>
           </div>
           <select 
             value={agrupamento}
             onChange={(e) => setAgrupamento(e.target.value as AgrupamentoArquivo)}
             className="bg-background border border-border rounded-lg px-2 h-7 text-[10px] font-bold focus:outline-none"
           >
             <option value="nenhum">Nenhum</option>
             <option value="tipo">Por Tipo</option>
             <option value="status">Por Status</option>
           </select>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ordernar:</span>
           </div>
           <select 
             value={ordenacao}
             onChange={(e) => setOrdenacao(e.target.value as OrdenacaoArquivo)}
             className="bg-background border border-border rounded-lg px-2 h-7 text-[10px] font-bold focus:outline-none"
           >
             <option value="nome">Nome (A-Z)</option>
             <option value="recentes">Mais Recentes</option>
           </select>
        </div>

        <button
          onClick={() => obterDados(true)}
          disabled={syncing}
          className="flex items-center justify-center gap-2 w-full h-8 rounded-xl bg-background border border-border hover:bg-muted/50 transition-colors text-[10px] font-black text-muted-foreground uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Atualizar Lista'}
        </button>
      </div>

      <div className="space-y-6">
        {statusVinculo.arquivos.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded-2xl text-center space-y-4">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vazio</p>
          </div>
        ) : agrupamento === 'tipo' ? (
          listaCategorias.map(cat => {
            const arqs = arquivosProcessados.filter(a => a.selected_folder === cat)
            if (arqs.length === 0) return null
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                     {formatarNomeTipo(cat)}
                   </span>
                   <div className="h-px flex-1 bg-border/40" />
                </div>
                {renderizarLista(arqs)}
              </div>
            )
          })
        ) : agrupamento === 'status' ? (
          ['Baixados', 'Pendentes'].map(status => {
            const arqs = arquivosProcessados.filter(a => status === 'Baixados' ? a.is_downloaded : !a.is_downloaded)
            if (arqs.length === 0) return null
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                     {status}
                   </span>
                   <div className="h-px flex-1 bg-border/40" />
                </div>
                {renderizarLista(arqs)}
              </div>
            )
          })
        ) : (
          renderizarLista(arquivosProcessados)
        )}
      </div>
    </div>
  )
}

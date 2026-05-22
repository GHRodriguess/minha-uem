'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ArquivoClassroom
} from '@/lib/api/classroom'
import {
  RefreshCw,
  Download,
  Edit2,
  Check,
  X,
  Folder,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  ArrowUpDown,
  Layers
} from 'lucide-react'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'

interface CardClassroomProps {
  materiaId: number
  anoId: number
}

type OrdenacaoArquivo = 'nome' | 'recentes'
type AgrupamentoArquivo = 'nenhum' | 'categoria' | 'status'

export function CardClassroom({ materiaId, anoId }: CardClassroomProps) {
  const { data: session } = useSession()

  const {
    filesCache,
    classroomConfig,
    loadingStates,
    syncingStates,
    directoryHandle,
    hasFolderPermission,
    isFileSystemSupported,
    solicitarAcessoPasta,
    desvincularPasta,
    obterArquivos,
    baixarItem,
    salvarNomePersonalizado,
    salvarPastaDestino,
    abrirItemLocal
  } = useClassroom()

  const [ordenacao, setOrdenacao] = useState<OrdenacaoArquivo>('nome')
  const [agrupamento, setAgrupamento] = useState<AgrupamentoArquivo>('categoria')

  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [customNameInput, setCustomNameInput] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loading = loadingStates[materiaId] || (!filesCache[materiaId])
  const syncing = syncingStates[materiaId] || false
  const statusVinculo = filesCache[materiaId] || { vinculado: false, arquivos: [] }
  const configClassroom = classroomConfig || { download_dir: 'Downloads/MinhaUEM', folder_options: 'documentos,exercicios' }

  const obterDados = useCallback(async (exibirSyncLoader: boolean = false) => {
    if (!session?.accessToken) return
    try {
      await obterArquivos(materiaId, anoId, exibirSyncLoader)
    } catch (error) {
      console.error(error)
    }
  }, [session, materiaId, anoId, obterArquivos])

  useEffect(() => {
    obterDados(false)
  }, [obterDados])

  const [missingFiles, setMissingFiles] = useState<Record<string, boolean>>({})

  const filesHash = useMemo(() => {
    if (!statusVinculo?.arquivos) return ''
    return JSON.stringify(statusVinculo.arquivos.map(a => [a.drive_file_id, a.custom_name, a.original_name, a.selected_folder, a.local_path]))
  }, [statusVinculo?.arquivos])

  useEffect(() => {
    if (!directoryHandle || !hasFolderPermission || !statusVinculo?.arquivos) return

    let isMounted = true
    const verificarPresencaFisica = async () => {
      const missing: Record<string, boolean> = {}
      const courseName = statusVinculo.curso_nome || "Sem_Curso"
      const year = statusVinculo.ano_letivo || ""
      const subjectName = statusVinculo.materia_nome || ""

      for (const arq of statusVinculo.arquivos) {
        const folder = arq.selected_folder || "documentos"
        const parts = ['UEM', 'Cursos', courseName, year, subjectName, folder]
        const fileName = arq.custom_name || arq.original_name
        
        try {
          const exists = await GerenciadorDiretorio.verificarArquivoExiste(directoryHandle, parts, fileName)
          if (exists) {
            localStorage.setItem('baixado_' + arq.drive_file_id, 'true')
          } else {
            localStorage.removeItem('baixado_' + arq.drive_file_id)
            missing[arq.drive_file_id] = true
          }
        } catch {
          localStorage.removeItem('baixado_' + arq.drive_file_id)
          missing[arq.drive_file_id] = true
        }
      }
      if (isMounted) {
        setMissingFiles(prev => {
          const hasChanged = Object.keys(missing).length !== Object.keys(prev).length ||
            Object.keys(missing).some(k => missing[k] !== prev[k])
          return hasChanged ? missing : prev
        })
      }
    }

    verificarPresencaFisica()
    return () => {
      isMounted = false
    }
  }, [filesHash, statusVinculo?.curso_nome, statusVinculo?.ano_letivo, statusVinculo?.materia_nome, directoryHandle, hasFolderPermission])

  const iniciarEdicaoNome = (arquivo: ArquivoClassroom) => {
    setEditingFileId(arquivo.drive_file_id)
    setCustomNameInput(arquivo.custom_name || arquivo.original_name)
  }

  const confirmarEdicaoNome = async (arquivo: ArquivoClassroom) => {
    if (!customNameInput.trim()) return
    try {
      await salvarNomePersonalizado(materiaId, anoId, arquivo.drive_file_id, arquivo.original_name, customNameInput.trim())
      setEditingFileId(null)
    } catch (error) {
      console.error(error)
    }
  }

  const alterarPastaDestino = async (arquivo: ArquivoClassroom, novaPasta: string) => {
    try {
      await salvarPastaDestino(materiaId, anoId, arquivo.drive_file_id, arquivo.original_name, novaPasta)
    } catch (error) {
      console.error(error)
    }
  }

  const lidarComDownload = async (driveFileId: string, originalName: string) => {
    if (!directoryHandle || !hasFolderPermission) {
      alert('Vincule a pasta de estudos e conceda permissão antes de baixar arquivos.')
      return
    }
    setDownloadingId(driveFileId)
    try {
      await baixarItem(materiaId, anoId, driveFileId, originalName)
      localStorage.setItem('baixado_' + driveFileId, 'true')
      setMissingFiles(prev => {
        const next = { ...prev }
        delete next[driveFileId]
        return next
      })
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro ao baixar o arquivo. Verifique se a pasta de estudos ainda está acessível.')
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

  const listaCategorias = configClassroom.folder_options.split(',').map(c => c.trim()).filter(Boolean).map(c => c === 'docs' ? 'documentos' : c)

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'documentos') return 'Documento'
    if (tipo === 'exercicios') return 'Exercício'
    return tipo.charAt(0).toUpperCase() + tipo.slice(1)
  }

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
        const isReallyDownloaded = hasFolderPermission
          ? !missingFiles[arquivo.drive_file_id]
          : localStorage.getItem('baixado_' + arquivo.drive_file_id) === 'true'

        return (
          <div
            key={arquivo.drive_file_id}
            className={`flex flex-col gap-3 p-4 border border-border rounded-2xl bg-card transition-all duration-200 ${isReallyDownloaded ? 'opacity-70 grayscale-[0.5]' : 'hover:border-primary/30 shadow-sm'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${isReallyDownloaded ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <FileText className="w-4 h-4" />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                {estaEditando ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      className="h-7 px-2 border border-border rounded-md bg-background text-[11px] font-bold w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                      value={customNameInput}
                      onChange={(e) => setCustomNameInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => confirmarEdicaoNome(arquivo)}
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
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide truncate max-w-30">
                      Original: {arquivo.original_name}
                    </p>
                  )}

                  {isReallyDownloaded && (
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
                className="h-8 px-2 border border-border rounded-lg bg-background text-[10px] font-bold focus:outline-none w-28 text-foreground"
                value={arquivo.selected_folder}
                onChange={(e) => alterarPastaDestino(arquivo, e.target.value)}
              >
                {listaCategorias.map((cat) => (
                  <option key={cat} value={cat}>
                    Tipo: {formatarNomeTipo(cat)}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                {isReallyDownloaded && (
                  <button
                    onClick={() => abrirItemLocal(materiaId, arquivo.id || arquivo.drive_file_id)}
                    className="flex items-center justify-center p-2 h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Visualizar arquivo local"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                )}

                {!isReallyDownloaded && (
                  <button
                    onClick={() => lidarComDownload(arquivo.drive_file_id, arquivo.original_name)}
                    disabled={estaBaixando}
                    className="flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-primary-foreground hover:opacity-90 shadow-sm disabled:opacity-50"
                  >
                    {estaBaixando ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    Baixar
                  </button>
                )}
              </div>
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
          onClick={() => obterDados(true)}
          className="flex items-center gap-2 mx-auto h-9 px-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors text-xs font-bold text-muted-foreground animate-pulse"
        >
          <RefreshCw className="w-3 h-3" />
          Sincronizar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isFileSystemSupported && !directoryHandle ? (
        <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            Modo offline desativado. Vincule uma pasta de estudos nas <a href="/configuracoes" className="text-primary hover:underline font-bold">Configurações Gerais</a> para salvar e acessar arquivos offline.
          </p>
        </div>
      ) : isFileSystemSupported && directoryHandle && !hasFolderPermission ? (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            Acesso à pasta local <span className="font-bold text-primary">{directoryHandle.name}</span> suspenso pelo navegador nesta sessão.
          </p>
          <button
            onClick={solicitarAcessoPasta}
            className="h-8 px-4 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-lg text-[10px] shadow-sm transition-opacity uppercase tracking-wider shrink-0"
          >
            Reautorizar Acesso
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Agrupar:</span>
          </div>
          <select
            value={agrupamento}
            onChange={(e) => setAgrupamento(e.target.value as AgrupamentoArquivo)}
            className="bg-background border border-border rounded-lg px-2 h-7 text-[10px] font-bold focus:outline-none text-foreground"
          >
            <option value="nenhum">Nenhum</option>
            <option value="categoria">Por Categoria</option>
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
            className="bg-background border border-border rounded-lg px-2 h-7 text-[10px] font-bold focus:outline-none text-foreground"
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
        ) : agrupamento === 'categoria' ? (
          [...listaCategorias, 'outros'].map(categoryItem => {
            const categoryFiles = arquivosProcessados.filter(fileItem => {
              if (categoryItem === 'outros') {
                return !fileItem.selected_folder || !listaCategorias.includes(fileItem.selected_folder)
              }
              return fileItem.selected_folder === categoryItem
            })
            if (categoryFiles.length === 0) return null
            return (
              <div key={categoryItem} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                    {categoryItem === 'outros' ? 'Sem Categoria' : formatarNomeTipo(categoryItem)}
                  </span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                {renderizarLista(categoryFiles)}
              </div>
            )
          })
        ) : agrupamento === 'status' ? (
          ['Baixados', 'Pendentes'].map(status => {
            const arqs = arquivosProcessados.filter(a => {
              const isDownloaded = hasFolderPermission
                ? !missingFiles[a.drive_file_id]
                : localStorage.getItem('baixado_' + a.drive_file_id) === 'true'
              return status === 'Baixados' ? isDownloaded : !isDownloaded
            })
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

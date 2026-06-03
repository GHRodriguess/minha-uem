'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  FileText, 
  Search, 
  Download, 
  Loader2, 
  Edit2, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Plus,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileImage,
  FileSpreadsheet,
  FileBox,
  FileSignature,
  Filter,
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ArquivoClassroom, StatusVinculoClassroom } from '@/lib/api/classroom'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'

interface TabelaArquivosProps {
  materiaId: number
  anoId: number
  dadosVinculo: StatusVinculoClassroom
}

export function TabelaArquivos({ materiaId, anoId, dadosVinculo }: TabelaArquivosProps) {
  const router = useRouter()
  const { 
    baixarItem,
    salvarNomePersonalizado,
    salvarPastaDestino,
    alternarOcultarArquivo,
    enviarArquivoLocal,
    directoryHandle,
    hasFolderPermission,
    isFileSystemSupported,
    solicitarAcessoPasta,
    escanearPastaLocal
  } = useClassroom()

  const lidarComPreVisualizacao = (arquivo: ArquivoClassroom) => {
    if (obterExtensao(arquivo.original_name) === 'pdf') {
      router.push(`/disciplinas/${materiaId}/arquivos/visualizador?fileId=${arquivo.drive_file_id}`)
    } else {
      setPreviewFile(arquivo)
    }
  }

  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [selectedExtension, setSelectedExtension] = useState('todos')
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [customNameInput, setCustomNameInput] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<ArquivoClassroom | null>(null)
  const [sortField, setSortField] = useState<'nome' | 'sincronizacao' | 'manual'>('manual')
  const [ordemManualVersao, setOrdemManualVersao] = useState(0)
  const [arquivoParaExcluir, setArquivoParaExcluir] = useState<ArquivoClassroom | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [mostrarOcultados, setMostrarOcultados] = useState(false)
  const [uploadModalAberto, setUploadModalAberto] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [missingFiles, setMissingFiles] = useState<Record<string, boolean>>({})
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'status'>('category')

  const filesHash = useMemo(() => {
    if (!dadosVinculo?.arquivos) return ''
    return JSON.stringify(dadosVinculo.arquivos.map(a => [a.drive_file_id, a.custom_name, a.original_name, a.selected_folder, a.local_path])) + `_${ordemManualVersao}`
  }, [dadosVinculo?.arquivos, ordemManualVersao])

  useEffect(() => {
    if (!directoryHandle || !hasFolderPermission || !dadosVinculo?.arquivos) return

    let isMounted = true
    const verificarPresencaFisica = async () => {
      const missing: Record<string, boolean> = {}
      const courseName = dadosVinculo.curso_nome || "Sem_Curso"
      const year = dadosVinculo.ano_letivo || ""
      const subjectName = dadosVinculo.materia_nome || ""

      for (const arq of dadosVinculo.arquivos) {
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
  }, [filesHash, dadosVinculo?.curso_nome, dadosVinculo?.ano_letivo, dadosVinculo?.materia_nome, directoryHandle, hasFolderPermission, dadosVinculo?.arquivos])

  useEffect(() => {
    if (!directoryHandle || !hasFolderPermission) return

    const sincronizarAoFocar = async () => {
      try {
        await escanearPastaLocal(materiaId, anoId)
      } catch (e) {
        console.error(e)
      }
    }

    const lidarComFoco = () => {
      sincronizarAoFocar()
    }

    window.addEventListener('focus', lidarComFoco)
    return () => {
      window.removeEventListener('focus', lidarComFoco)
    }
  }, [materiaId, anoId, directoryHandle, hasFolderPermission, escanearPastaLocal])

  const alterarOrdenacao = (campo: 'nome' | 'sincronizacao') => {
    if (sortField === campo) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(campo)
      setSortDirection('asc')
    }
  }

  const customFoldersList = dadosVinculo?.custom_folders
    ? dadosVinculo.custom_folders.split(',').map(c => c.trim()).filter(Boolean)
    : []
  const listaCategorias = ['documentos', 'exercicios', ...customFoldersList]

  const obterExtensao = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  const determinarIcone = (filename: string) => {
    const ext = obterExtensao(filename)
    if (ext === 'pdf') return <FileSignature className="w-5 h-5 text-red-500" />
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-amber-500" />
    }
    if (['doc', 'docx', 'odt', 'txt'].includes(ext)) {
      return <FileText className="w-5 h-5 text-blue-500" />
    }
    return <FileBox className="w-5 h-5 text-muted-foreground" />
  }

  const categorizarExtensao = (filename: string) => {
    const ext = obterExtensao(filename)
    if (ext === 'pdf') return 'pdf'
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'planilha'
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'imagem'
    if (['doc', 'docx', 'odt', 'txt'].includes(ext)) return 'documento'
    return 'outro'
  }

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'documentos') return 'Documento'
    if (tipo === 'exercicios') return 'Exercício'
    return tipo.charAt(0).toUpperCase() + tipo.slice(1)
  }

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '-'
    const date = new Date(dataStr)
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const iniciarEdicaoNome = (arquivo: ArquivoClassroom) => {
    setEditingFileId(arquivo.drive_file_id)
    setCustomNameInput(arquivo.custom_name || arquivo.original_name)
  }

  const confirmarEdicaoNome = async (arquivo: ArquivoClassroom) => {
    if (!customNameInput.trim()) return
    try {
      await salvarNomePersonalizado(
        materiaId,
        anoId,
        arquivo.drive_file_id,
        arquivo.original_name,
        customNameInput.trim()
      )
      setEditingFileId(null)
    } catch (error) {
      console.error(error)
    }
  }

  const gerenciarDownload = async (arquivo: ArquivoClassroom) => {
    if (!directoryHandle || !hasFolderPermission) {
      alert('Vincule sua pasta de estudos e conceda permissão de acesso nas Configurações Gerais para baixar arquivos offline.')
      return
    }
    setDownloadingId(arquivo.drive_file_id)
    try {
      await baixarItem(materiaId, anoId, arquivo.drive_file_id, arquivo.original_name)
      localStorage.setItem('baixado_' + arquivo.drive_file_id, 'true')
      setMissingFiles(prev => {
        const next = { ...prev }
        delete next[arquivo.drive_file_id]
        return next
      })
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro ao baixar o arquivo. Verifique se a pasta de estudos ainda está acessível.')
    } finally {
      setDownloadingId(null)
    }
  }

  const alterarPastaDestino = async (arquivo: ArquivoClassroom, novaPasta: string) => {
    try {
      await salvarPastaDestino(materiaId, anoId, arquivo.drive_file_id, arquivo.original_name, novaPasta)
    } catch (error) {
      console.error(error)
    }
  }

  const limparFiltros = () => {
    setSearchText('')
    setSelectedCategory('todos')
    setSelectedExtension('todos')
    setSelectedStatus('todos')
    setMostrarOcultados(false)
    setGroupBy('category')
  }

  const gerenciarExclusaoLocal = (arquivo: ArquivoClassroom) => {
    setArquivoParaExcluir(arquivo)
  }

  const confirmarExclusaoFisica = async () => {
    if (!arquivoParaExcluir || !directoryHandle || !hasFolderPermission || !dadosVinculo) return
    try {
      const courseName = dadosVinculo.curso_nome || "Sem_Curso"
      const year = dadosVinculo.ano_letivo || ""
      const subjectName = dadosVinculo.materia_nome || ""
      const folder = arquivoParaExcluir.selected_folder || "documentos"
      const parts = ['UEM', 'Cursos', courseName, year, subjectName, folder]
      const fileName = arquivoParaExcluir.custom_name || arquivoParaExcluir.original_name
      
      const success = await GerenciadorDiretorio.removerArquivoLocal(directoryHandle, parts, fileName)
      if (success) {
        localStorage.removeItem('baixado_' + arquivoParaExcluir.drive_file_id)
        await escanearPastaLocal(materiaId, anoId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setArquivoParaExcluir(null)
    }
  }

  const lidarComReordenacaoManual = (draggedId: string, targetId: string) => {
    const list = [...arquivosOrdenados]
    const idxDragged = list.findIndex(f => f.drive_file_id === draggedId)
    const idxTarget = list.findIndex(f => f.drive_file_id === targetId)
    if (idxDragged === -1 || idxTarget === -1) return

    const [draggedItem] = list.splice(idxDragged, 1)
    list.splice(idxTarget, 0, draggedItem)

    const orderedIds = list.map(f => f.drive_file_id)
    localStorage.setItem(`minha_uem_visualizador_ordem_${materiaId}`, JSON.stringify(orderedIds))
    setSortField('manual')
    setOrdemManualVersao(v => v + 1)
  }

  const gerenciarOcultar = async (arquivo: ArquivoClassroom) => {
    try {
      await alternarOcultarArquivo(
        materiaId,
        anoId,
        arquivo.drive_file_id,
        arquivo.original_name,
        !arquivo.is_ignored
      )
    } catch (error) {
      console.error(error)
    }
  }

  const gerenciarUploadLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return
    setEnviando(true)
    try {
      const category = uploadCategory || listaCategorias[0] || 'documentos'
      await enviarArquivoLocal(materiaId, anoId, category, uploadFile)
      setUploadModalAberto(false)
      setUploadFile(null)
    } catch (error) {
      console.error(error)
    } finally {
      setEnviando(false)
    }
  }

  const allFilesActiveOrder = useMemo(() => {
    if (!dadosVinculo?.arquivos) return []
    if (ordemManualVersao < 0) return []
    return [...dadosVinculo.arquivos].sort((a, b) => {
      if (sortField === 'manual') {
        const storedOrder = localStorage.getItem(`minha_uem_visualizador_ordem_${materiaId}`)
        if (storedOrder) {
          try {
            const orderedIds: string[] = JSON.parse(storedOrder)
            const idxA = orderedIds.indexOf(a.drive_file_id)
            const idxB = orderedIds.indexOf(b.drive_file_id)
            if (idxA !== -1 && idxB !== -1) {
              return sortDirection === 'asc' ? idxA - idxB : idxB - idxA
            }
            if (idxA !== -1) return sortDirection === 'asc' ? -1 : 1
            if (idxB !== -1) return sortDirection === 'asc' ? 1 : -1
          } catch (e) {
            console.error(e)
          }
        }
        const nameA = (a.custom_name || a.original_name).toLowerCase()
        const nameB = (b.custom_name || b.original_name).toLowerCase()
        return nameA.localeCompare(nameB, 'pt-BR')
      }

      if (sortField === 'nome') {
        const nameA = (a.custom_name || a.original_name).toLowerCase()
        const nameB = (b.custom_name || b.original_name).toLowerCase()
        return sortDirection === 'asc'
          ? nameA.localeCompare(nameB, 'pt-BR')
          : nameB.localeCompare(nameA, 'pt-BR')
      } else if (sortField === 'sincronizacao') {
        const dataA = a.sync_at ? new Date(a.sync_at).getTime() : 0
        const dataB = b.sync_at ? new Date(b.sync_at).getTime() : 0
        return sortDirection === 'asc' ? dataA - dataB : dataB - dataA
      }
      return 0
    })
  }, [dadosVinculo?.arquivos, sortField, sortDirection, materiaId, ordemManualVersao])

  useEffect(() => {
    if (allFilesActiveOrder.length === 0) return
    const orderedIds = allFilesActiveOrder.map(f => f.drive_file_id)
    const currentJson = JSON.stringify(orderedIds)
    const storedOrder = localStorage.getItem(`minha_uem_visualizador_ordem_${materiaId}`)
    if (storedOrder !== currentJson) {
      localStorage.setItem(`minha_uem_visualizador_ordem_${materiaId}`, currentJson)
      if (!storedOrder) {
        setOrdemManualVersao(v => v + 1)
      }
    }
  }, [allFilesActiveOrder, materiaId])


  const arquivosFiltrados = dadosVinculo.arquivos.filter(arquivo => {
    const nomeCompara = (arquivo.custom_name || arquivo.original_name).toLowerCase()
    const originalCompara = arquivo.original_name.toLowerCase()
    const matchesSearch = nomeCompara.includes(searchText.toLowerCase()) || originalCompara.includes(searchText.toLowerCase())
    
    const matchesCategory = selectedCategory === 'todos' || arquivo.selected_folder === selectedCategory
    
    const extGrupo = categorizarExtensao(arquivo.original_name)
    const matchesExtension = selectedExtension === 'todos' || extGrupo === selectedExtension
    
    const isReallyDownloaded = hasFolderPermission
      ? !missingFiles[arquivo.drive_file_id]
      : localStorage.getItem('baixado_' + arquivo.drive_file_id) === 'true'

    const matchesStatus = selectedStatus === 'todos' || 
      (selectedStatus === 'baixados' && isReallyDownloaded) ||
      (selectedStatus === 'pendentes' && !isReallyDownloaded)

    const matchesOcultados = mostrarOcultados ? true : !arquivo.is_ignored

    return matchesSearch && matchesCategory && matchesExtension && matchesStatus && matchesOcultados
  })

  const arquivosOrdenados = [...arquivosFiltrados].sort((a, b) => {
    if (sortField === 'manual') {
      const storedOrder = localStorage.getItem(`minha_uem_visualizador_ordem_${materiaId}`)
      if (storedOrder) {
        try {
          const orderedIds: string[] = JSON.parse(storedOrder)
          const idxA = orderedIds.indexOf(a.drive_file_id)
          const idxB = orderedIds.indexOf(b.drive_file_id)
          if (idxA !== -1 && idxB !== -1) {
            return sortDirection === 'asc' ? idxA - idxB : idxB - idxA
          }
          if (idxA !== -1) return sortDirection === 'asc' ? -1 : 1
          if (idxB !== -1) return sortDirection === 'asc' ? 1 : -1
        } catch (e) {
          console.error(e)
        }
      }
      const nomeA = (a.custom_name || a.original_name).toLowerCase()
      const nomeB = (b.custom_name || b.original_name).toLowerCase()
      return nomeA.localeCompare(nomeB, 'pt-BR')
    }

    if (sortField === 'nome') {
      const nomeA = (a.custom_name || a.original_name).toLowerCase()
      const nomeB = (b.custom_name || b.original_name).toLowerCase()
      return sortDirection === 'asc'
        ? nomeA.localeCompare(nomeB, 'pt-BR')
        : nomeB.localeCompare(nomeA, 'pt-BR')
    } else if (sortField === 'sincronizacao') {
      const dataA = a.sync_at ? new Date(a.sync_at).getTime() : 0
      const dataB = b.sync_at ? new Date(b.sync_at).getTime() : 0
      return sortDirection === 'asc' ? dataA - dataB : dataB - dataA
    }
    return 0
  })

  const renderizarLinhaArquivo = (arquivo: ArquivoClassroom) => {
    const estaEditando = editingFileId === arquivo.drive_file_id
    const estaBaixando = downloadingId === arquivo.drive_file_id
    const isReallyDownloaded = hasFolderPermission
      ? !missingFiles[arquivo.drive_file_id]
      : localStorage.getItem('baixado_' + arquivo.drive_file_id) === 'true'

    return (
      <tr 
        key={arquivo.drive_file_id} 
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', arquivo.drive_file_id)
        }}
        onDragOver={(e) => {
          e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          const draggedId = e.dataTransfer.getData('text/plain')
          if (draggedId && draggedId !== arquivo.drive_file_id) {
            lidarComReordenacaoManual(draggedId, arquivo.drive_file_id)
          }
        }}
        className={`hover:bg-muted/10 transition-colors text-xs text-foreground font-medium cursor-grab active:cursor-grabbing ${arquivo.is_ignored ? 'opacity-50 bg-muted/10' : ''}`}
      >
        <td className="py-4 px-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-background border border-border rounded-xl shrink-0">
              {determinarIcone(arquivo.original_name)}
            </div>
            
            <div className="space-y-0.5 min-w-0 flex-1">
              {estaEditando ? (
                <div className="flex items-center gap-1.5 max-w-lg">
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    className="h-8 px-2.5 border border-border rounded-lg bg-background text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    autoFocus
                  />
                  <button
                    onClick={() => confirmarEdicaoNome(arquivo)}
                    className="p-1.5 rounded-lg bg-emerald-500 text-white hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingFileId(null)}
                    className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2 group max-w-xl">
                  <p className="font-bold text-foreground wrap-break-words whitespace-normal leading-relaxed">
                    {arquivo.custom_name || arquivo.original_name}
                  </p>
                  <button
                    onClick={() => iniciarEdicaoNome(arquivo)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted shrink-0 mt-0.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {arquivo.custom_name && (
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider wrap-break-words whitespace-normal leading-normal">
                  Original: {arquivo.original_name}
                </p>
              )}
            </div>
          </div>
        </td>
        
        <td className="py-4 px-6">
          <select
             value={arquivo.selected_folder}
            onChange={(e) => alterarPastaDestino(arquivo, e.target.value)}
            className="h-8 px-2 border border-border rounded-lg bg-background text-[10px] font-black uppercase tracking-wider focus:outline-none w-full text-foreground"
          >
            {listaCategorias.map(cat => (
              <option key={cat} value={cat}>
                {formatarNomeTipo(cat)}
              </option>
            ))}
          </select>
        </td>

        <td className="py-4 px-6 font-bold text-muted-foreground text-[10px]">
          {formatarData(arquivo.sync_at)}
        </td>

        <td className="py-4 px-6">
          {isReallyDownloaded ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/15">
              <CheckCircle2 className="w-3 h-3" />
              Baixado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary/15">
              <AlertCircle className="w-3 h-3" />
              No Drive
            </span>
          )}
        </td>

        <td className="py-4 px-6 text-left">
          <div className="flex items-center justify-start gap-1.5">
            {(!arquivo.drive_file_id.startsWith('local_') || obterExtensao(arquivo.original_name) === 'pdf') && (
              <button
                onClick={() => lidarComPreVisualizacao(arquivo)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                title="Pré-visualizar"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => gerenciarOcultar(arquivo)}
              className={`p-2 border border-border rounded-xl transition-colors ${arquivo.is_ignored ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'}`}
              title={arquivo.is_ignored ? "Mostrar arquivo" : "Ocultar arquivo"}
            >
              {arquivo.is_ignored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {!arquivo.drive_file_id.startsWith('local_') && (
              <a
                href={`https://drive.google.com/file/d/${arquivo.drive_file_id}/view?usp=drivesdk`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
                title="Ver no Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {!arquivo.drive_file_id.startsWith('local_') && !isReallyDownloaded && (
              <button
                onClick={() => gerenciarDownload(arquivo)}
                disabled={estaBaixando}
                className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-primary/20 bg-primary text-primary-foreground hover:opacity-90 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {estaBaixando ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                Baixar
              </button>
            )}

            {isReallyDownloaded && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  gerenciarExclusaoLocal(arquivo)
                }}
                className="p-2 border border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-colors cursor-pointer"
                title="Excluir arquivo localmente"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const renderizarCartaoArquivo = (arquivo: ArquivoClassroom) => {
    const estaEditando = editingFileId === arquivo.drive_file_id
    const estaBaixando = downloadingId === arquivo.drive_file_id
    const isReallyDownloaded = hasFolderPermission
      ? !missingFiles[arquivo.drive_file_id]
      : localStorage.getItem('baixado_' + arquivo.drive_file_id) === 'true'

    return (
      <div 
        key={arquivo.drive_file_id}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', arquivo.drive_file_id)
        }}
        onDragOver={(e) => {
          e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          const draggedId = e.dataTransfer.getData('text/plain')
          if (draggedId && draggedId !== arquivo.drive_file_id) {
            lidarComReordenacaoManual(draggedId, arquivo.drive_file_id)
          }
        }}
        className={`bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4 relative transition-all hover:border-primary/30 cursor-grab active:cursor-grabbing ${
          arquivo.is_ignored ? 'opacity-50 bg-muted/10' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-background border border-border rounded-xl shrink-0">
            {determinarIcone(arquivo.original_name)}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            {estaEditando ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  className="h-8 px-2 border border-border rounded-lg bg-background text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  autoFocus
                />
                <button
                  onClick={() => confirmarEdicaoNome(arquivo)}
                  className="p-1.5 rounded-lg bg-emerald-500 text-white hover:opacity-90 transition-opacity"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingFileId(null)}
                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2 group w-full justify-between">
                <p className="font-bold text-foreground text-xs leading-relaxed wrap-break-words whitespace-normal">
                  {arquivo.custom_name || arquivo.original_name}
                </p>
                <button
                  onClick={() => iniciarEdicaoNome(arquivo)}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {arquivo.custom_name && (
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider break-all whitespace-normal">
                Original: {arquivo.original_name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-[10px]">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Categoria</span>
            <select
              value={arquivo.selected_folder}
              onChange={(e) => alterarPastaDestino(arquivo, e.target.value)}
              className="h-8 px-2 border border-border bg-background rounded-lg text-[9px] font-black uppercase tracking-wider focus:outline-none w-full text-foreground"
            >
              {listaCategorias.map(cat => (
                <option key={cat} value={cat}>
                  {formatarNomeTipo(cat)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Status</span>
            <div className="h-8 flex items-center">
              {isReallyDownloaded ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/15 w-fit">
                  <CheckCircle2 className="w-3 h-3" />
                  Baixado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary/15 w-fit">
                  <AlertCircle className="w-3 h-3" />
                  No Drive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border/50">
          <span className="text-[9px] font-bold text-muted-foreground order-2 sm:order-1">
            Sinc: {formatarData(arquivo.sync_at)}
          </span>
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            {(!arquivo.drive_file_id.startsWith('local_') || obterExtensao(arquivo.original_name) === 'pdf') && (
              <button
                onClick={() => lidarComPreVisualizacao(arquivo)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                title="Pré-visualizar"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => gerenciarOcultar(arquivo)}
              className={`p-2 border border-border rounded-xl transition-colors ${
                arquivo.is_ignored 
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                  : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              title={arquivo.is_ignored ? "Mostrar arquivo" : "Ocultar arquivo"}
            >
              {arquivo.is_ignored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {!arquivo.drive_file_id.startsWith('local_') && (
              <a
                href={`https://drive.google.com/file/d/${arquivo.drive_file_id}/view?usp=drivesdk`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
                title="Ver no Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {!arquivo.drive_file_id.startsWith('local_') && !isReallyDownloaded && (
              <button
                onClick={() => gerenciarDownload(arquivo)}
                disabled={estaBaixando}
                className="hidden lg:flex items-center gap-1 h-8 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-primary/20 bg-primary text-primary-foreground hover:opacity-90 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {estaBaixando ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                Baixar
              </button>
            )}

            {isReallyDownloaded && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  gerenciarExclusaoLocal(arquivo)
                }}
                className="p-2 border border-border bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-colors cursor-pointer"
                title="Excluir arquivo localmente"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
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

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-foreground font-bold text-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filtros de Busca</span>
          </div>
          <button
            onClick={() => {
              if (!directoryHandle || !hasFolderPermission) {
                alert('Vincule a pasta de estudos e conceda permissão antes de adicionar arquivos locais.')
                return
              }
              setUploadCategory(listaCategorias[0] || 'documentos')
              setUploadModalAberto(true)
            }}
            disabled={!directoryHandle || !hasFolderPermission}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-xl text-xs shadow-sm transition-opacity disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Arquivo</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 h-10 border border-border bg-background rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none text-foreground"
            >
              <option value="todos">Todas Categorias</option>
              {listaCategorias.map(cat => (
                <option key={cat} value={cat}>{formatarNomeTipo(cat)}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedExtension}
              onChange={(e) => setSelectedExtension(e.target.value)}
              className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none text-foreground"
            >
              <option value="todos">Todos Tipos</option>
              <option value="pdf">Documentos PDF (.pdf)</option>
              <option value="documento">Documentos Texto (.doc, .docx, .txt)</option>
              <option value="planilha">Planilhas (.xls, .xlsx, .csv)</option>
              <option value="imagem">Imagens (.png, .jpg, .webp)</option>
              <option value="outro">Outros formatos</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none text-foreground"
            >
              <option value="todos">Todos Status</option>
              <option value="baixados">Baixados Localmente</option>
              <option value="pendentes">Disponíveis no Drive</option>
            </select>
          </div>

          <div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'category' | 'status')}
              className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none text-foreground"
            >
              <option value="none">Sem Agrupamento</option>
              <option value="category">Agrupar: Categoria</option>
              <option value="status">Agrupar: Status</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground font-bold">
            <input
              type="checkbox"
              checked={mostrarOcultados}
              onChange={(e) => setMostrarOcultados(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/20 accent-primary"
            />
            <span>Mostrar arquivos ocultados</span>
          </label>

          {(searchText || selectedCategory !== 'todos' || selectedExtension !== 'todos' || selectedStatus !== 'todos' || mostrarOcultados) && (
            <button
              onClick={limparFiltros}
              className="h-8 px-4 border border-border bg-background hover:bg-muted text-[10px] font-black uppercase tracking-wider rounded-lg text-muted-foreground transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Visualização Adaptativa em Cartões (Mobile e iPad Retrato) */}
      <div className="block md:hidden space-y-6">
        {arquivosOrdenados.length === 0 ? (
          <div className="py-12 text-center bg-card border border-border rounded-3xl shadow-sm space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="text-xs font-bold text-foreground">Nenhum arquivo encontrado</p>
            <p className="text-[10px] text-muted-foreground">Tente alterar os termos da busca ou os filtros de seleção.</p>
          </div>
        ) : groupBy === 'category' ? (
          [...listaCategorias, 'outros'].map(categoryItem => {
            const categoryFiles = arquivosOrdenados.filter(fileItem => {
              if (categoryItem === 'outros') {
                return !fileItem.selected_folder || !listaCategorias.includes(fileItem.selected_folder)
              }
              return fileItem.selected_folder === categoryItem
            })
            if (categoryFiles.length === 0) return null
            return (
              <div key={categoryItem} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                    {categoryItem === 'outros' ? 'Sem Categoria' : formatarNomeTipo(categoryItem)}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{categoryFiles.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryFiles.map(renderizarCartaoArquivo)}
                </div>
              </div>
            )
          })
        ) : groupBy === 'status' ? (
          ['Baixados', 'Pendentes'].map(statusGroup => {
            const arqs = arquivosOrdenados.filter(a => {
              const isDownloaded = hasFolderPermission
                ? !missingFiles[a.drive_file_id]
                : localStorage.getItem('baixado_' + a.drive_file_id) === 'true'
              return statusGroup === 'Baixados' ? isDownloaded : !isDownloaded
            })
            if (arqs.length === 0) return null
            return (
              <div key={statusGroup} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                    {statusGroup === 'Baixados' ? 'Baixados' : 'Disponíveis no Drive'}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{arqs.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {arqs.map(renderizarCartaoArquivo)}
                </div>
              </div>
            )
          })
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {arquivosOrdenados.map(renderizarCartaoArquivo)}
          </div>
        )}
      </div>

      {/* Visualização Padrão em Tabela (Laptops/Desktop) */}
      <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <th 
                  className="py-4 px-6 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => alterarOrdenacao('nome')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nome do Arquivo</span>
                    {sortField === 'nome' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-6 w-36">Categoria</th>
                <th 
                  className="py-4 px-6 w-44 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => alterarOrdenacao('sincronizacao')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Última Sincronização</span>
                    {sortField === 'sincronizacao' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-6 w-28">Status</th>
                <th className="py-4 px-6 w-44 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {arquivosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground/30" />
                      <p className="text-xs font-bold text-foreground">Nenhum arquivo encontrado</p>
                      <p className="text-[10px] text-muted-foreground">Tente alterar os termos da busca ou os filtros de seleção.</p>
                    </div>
                  </td>
                </tr>
              ) : groupBy === 'category' ? (
                [...listaCategorias, 'outros'].map(categoryItem => {
                  const categoryFiles = arquivosOrdenados.filter(fileItem => {
                    if (categoryItem === 'outros') {
                      return !fileItem.selected_folder || !listaCategorias.includes(fileItem.selected_folder)
                    }
                    return fileItem.selected_folder === categoryItem
                  })
                  if (categoryFiles.length === 0) return null
                  return (
                    <React.Fragment key={categoryItem}>
                      <tr className="bg-muted/5 font-bold">
                        <td colSpan={5} className="py-3 px-6 text-primary text-[10px] font-black uppercase tracking-widest border-b border-border/40">
                          {categoryItem === 'outros' ? 'Sem Categoria' : formatarNomeTipo(categoryItem)} ({categoryFiles.length})
                        </td>
                      </tr>
                      {categoryFiles.map(renderizarLinhaArquivo)}
                    </React.Fragment>
                  )
                })
              ) : groupBy === 'status' ? (
                ['Baixados', 'Pendentes'].map(statusGroup => {
                  const arqs = arquivosOrdenados.filter(a => {
                    const isDownloaded = hasFolderPermission
                      ? !missingFiles[a.drive_file_id]
                      : localStorage.getItem('baixado_' + a.drive_file_id) === 'true'
                    return statusGroup === 'Baixados' ? isDownloaded : !isDownloaded
                  })
                  if (arqs.length === 0) return null
                  return (
                    <React.Fragment key={statusGroup}>
                      <tr className="bg-muted/5 font-bold">
                        <td colSpan={5} className="py-3 px-6 text-primary text-[10px] font-black uppercase tracking-widest border-b border-border/40">
                          {statusGroup === 'Baixados' ? 'Baixados' : 'Disponíveis no Drive'} ({arqs.length})
                        </td>
                      </tr>
                      {arqs.map(renderizarLinhaArquivo)}
                    </React.Fragment>
                  )
                })
              ) : (
                arquivosOrdenados.map(renderizarLinhaArquivo)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-background border border-border rounded-xl">
                  {determinarIcone(previewFile.original_name)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {previewFile.custom_name || previewFile.original_name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Pré-visualização do Documento
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-muted/5 p-4 relative">
              <iframe
                src={`https://drive.google.com/file/d/${previewFile.drive_file_id}/preview`}
                className="w-full h-full border-0 rounded-2xl bg-background"
                allow="autoplay"
              />
            </div>

            <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                ID do Drive: {previewFile.drive_file_id}
              </div>
              
              <div className="flex gap-2">
                <a
                  href={`https://drive.google.com/file/d/${previewFile.drive_file_id}/view?usp=drivesdk`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-9 px-4 border border-border bg-background hover:bg-muted rounded-xl text-xs font-bold text-muted-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir no Drive
                </a>

                <button
                  onClick={() => {
                    gerenciarDownload(previewFile)
                    setPreviewFile(null)
                  }}
                  className="hidden lg:flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold shadow-sm transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-background border border-border rounded-xl">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Adicionar Arquivo Local
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Salvar arquivo diretamente na pasta da matéria
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadModalAberto(false)
                  setUploadFile(null)
                }}
                className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={gerenciarUploadLocal} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Categoria de Destino
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full h-10 px-3 border border-border bg-background rounded-xl text-xs font-bold focus:outline-none text-foreground"
                  required
                >
                  {listaCategorias.map(cat => (
                    <option key={cat} value={cat}>
                      {formatarNomeTipo(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Selecionar Arquivo
                </label>
                <div 
                  className={`border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/5 ${uploadFile ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                  onClick={() => document.getElementById('local-file-input')?.click()}
                >
                  <input
                    id="local-file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setUploadFile(e.target.files[0])
                      }
                    }}
                  />
                  
                  {uploadFile ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full w-fit mx-auto">
                        <Check className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-foreground text-center truncate px-2">
                        {uploadFile.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {(uploadFile.size / 1024).toFixed(1)} KB • Clique para trocar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2 bg-muted rounded-full w-fit mx-auto text-muted-foreground">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        Clique para selecionar um arquivo
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        O arquivo será salvo na pasta correspondente no disco
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalAberto(false)
                    setUploadFile(null)
                  }}
                  className="flex items-center justify-center h-10 px-4 border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !uploadFile}
                  className="flex items-center justify-center gap-1.5 h-10 px-5 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-xl text-xs shadow-sm transition-opacity disabled:opacity-50"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Adicionar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {arquivoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-backdrop">
          <div className="bg-card border border-border w-full max-w-sm flex flex-col rounded-3xl shadow-2xl p-6 gap-4 animate-scale-modal">
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/10 rounded-full w-fit mx-auto">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                Excluir arquivo offline?
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                Esta ação apagará fisicamente o arquivo do seu computador local. Você poderá baixá-lo novamente do Google Drive quando precisar.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setArquivoParaExcluir(null)}
                className="flex-1 h-9 border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusaoFisica}
                className="flex-1 h-9 bg-destructive hover:bg-destructive/90 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

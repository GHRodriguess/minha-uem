'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  Search, 
  Download, 
  Loader2, 
  Edit2, 
  Check, 
  X, 
  Eye, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileImage,
  FileSpreadsheet,
  FileBox,
  FileSignature,
  Filter,
  RefreshCw,
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { ArquivoClassroom, StatusVinculoClassroom } from '@/lib/api/classroom'
import { useClassroom } from '@/components/providers/ProvedorClassroom'

interface TabelaArquivosProps {
  materiaId: number
  anoId: number
  dadosVinculo: StatusVinculoClassroom
}

export function TabelaArquivos({ materiaId, anoId, dadosVinculo }: TabelaArquivosProps) {
  const { 
    classroomConfig,
    baixarItem,
    salvarNomePersonalizado,
    salvarPastaDestino
  } = useClassroom()

  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [selectedExtension, setSelectedExtension] = useState('todos')
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [customNameInput, setCustomNameInput] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<ArquivoClassroom | null>(null)
  const [sortField, setSortField] = useState<'nome' | 'sincronizacao'>('nome')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const alterarOrdenacao = (campo: 'nome' | 'sincronizacao') => {
    if (sortField === campo) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(campo)
      setSortDirection('asc')
    }
  }

  const listaCategorias = classroomConfig?.folder_options
    ? classroomConfig.folder_options.split(',').map(c => c.trim()).filter(Boolean)
    : ['documentos', 'exercicios']

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
    setDownloadingId(arquivo.drive_file_id)
    try {
      await baixarItem(materiaId, anoId, arquivo.drive_file_id, arquivo.original_name)
    } catch (error) {
      console.error(error)
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
  }

  const arquivosFiltrados = dadosVinculo.arquivos.filter(arquivo => {
    const nomeCompara = (arquivo.custom_name || arquivo.original_name).toLowerCase()
    const originalCompara = arquivo.original_name.toLowerCase()
    const matchesSearch = nomeCompara.includes(searchText.toLowerCase()) || originalCompara.includes(searchText.toLowerCase())
    
    const matchesCategory = selectedCategory === 'todos' || arquivo.selected_folder === selectedCategory
    
    const extGrupo = categorizarExtensao(arquivo.original_name)
    const matchesExtension = selectedExtension === 'todos' || extGrupo === selectedExtension
    
    const matchesStatus = selectedStatus === 'todos' || 
      (selectedStatus === 'baixados' && arquivo.is_downloaded) ||
      (selectedStatus === 'pendentes' && !arquivo.is_downloaded)

    return matchesSearch && matchesCategory && matchesExtension && matchesStatus
  })

  const arquivosOrdenados = [...arquivosFiltrados].sort((a, b) => {
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

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filtros de Busca</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>

        {(searchText || selectedCategory !== 'todos' || selectedExtension !== 'todos' || selectedStatus !== 'todos') && (
          <div className="flex justify-end">
            <button
              onClick={limparFiltros}
              className="h-8 px-4 border border-border bg-background hover:bg-muted text-[10px] font-black uppercase tracking-wider rounded-lg text-muted-foreground transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
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
                <th className="py-4 px-6 w-44 text-right">Ações</th>
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
              ) : (
                arquivosOrdenados.map((arquivo) => {
                  const estaEditando = editingFileId === arquivo.drive_file_id
                  const estaBaixando = downloadingId === arquivo.drive_file_id

                  return (
                    <tr 
                      key={arquivo.drive_file_id} 
                      className={`hover:bg-muted/10 transition-colors text-xs text-foreground font-medium ${arquivo.is_downloaded ? 'opacity-95' : ''}`}
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
                        {arquivo.is_downloaded ? (
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

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewFile(arquivo)}
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
                            title="Pré-visualizar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://drive.google.com/file/d/${arquivo.drive_file_id}/view?usp=drivesdk`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
                            title="Ver no Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => gerenciarDownload(arquivo)}
                            disabled={estaBaixando}
                            className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${arquivo.is_downloaded ? 'border-border bg-background text-muted-foreground hover:bg-muted' : 'border-primary/20 bg-primary text-primary-foreground hover:opacity-90 shadow-sm'} disabled:opacity-50`}
                          >
                            {estaBaixando ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            {arquivo.is_downloaded ? 'Re-baixar' : 'Baixar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
                  className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold shadow-sm transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

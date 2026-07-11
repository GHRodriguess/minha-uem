'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusVinculoClassroom, ArquivoClassroom } from '@/lib/api/classroom'
import { useGradeArquivos } from './useGradeArquivos'
import { BarraFiltrosCompacta } from '@/components/molecules/BarraFiltrosCompacta'
import { GradeCategoriasArquivos } from './GradeCategoriasArquivos'
import { PainelEstatisticasLegenda } from './PainelEstatisticasLegenda'
import { ModalUploadLocal } from '@/components/molecules/ModalUploadLocal'
import { ModalConfirmarExclusaoLocal } from '@/components/molecules/ModalConfirmarExclusaoLocal'
import { ModalVisualizadorIframe } from '@/components/molecules/ModalVisualizadorIframe'

interface TabelaArquivosProps {
  materiaId: number
  anoId: number
  dadosVinculo: StatusVinculoClassroom
}

export function TabelaArquivos({ materiaId, anoId, dadosVinculo }: TabelaArquivosProps) {
  const router = useRouter()
  const { classroom, missingFiles, filtros, acoes } = useGradeArquivos(materiaId, anoId, dadosVinculo)
  const [previewFile, setPreviewFile] = useState<ArquivoClassroom | null>(null)

  const lidarComPreVisualizacao = (arquivo: ArquivoClassroom) => {
    const ext = arquivo.original_name.split('.').pop()?.toLowerCase() || ''
    const formats = ['pdf', 'mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp', 'txt', 'py', 'js', 'ts', 'html', 'css', 'json', 'md', 'java', 'cpp', 'c', 'sql', 'sh', 'yml', 'yaml', 'doc', 'docx']
    if (formats.includes(ext)) {
      router.push(`/disciplinas/${materiaId}/arquivos/visualizador?fileId=${arquivo.drive_file_id}`)
    } else if (!arquivo.drive_file_id.startsWith('local_') && !arquivo.drive_file_id.startsWith('LOCAL_')) {
      setPreviewFile(arquivo)
    }
  }

  const lidarComReordenacaoManual = (draggedId: string, targetId: string) => {
    const list = [...filtros.arquivosOrdenados]
    const idxDragged = list.findIndex(f => f.drive_file_id === draggedId)
    const idxTarget = list.findIndex(f => f.drive_file_id === targetId)
    if (idxDragged === -1 || idxTarget === -1) return
    const [draggedItem] = list.splice(idxDragged, 1)
    list.splice(idxTarget, 0, draggedItem)
    localStorage.setItem(`minha_uem_visualizador_ordem_${materiaId}`, JSON.stringify(list.map(f => f.drive_file_id)))
    filtros.setOrdemManualVersao(v => v + 1)
  }

  const customFoldersList = dadosVinculo?.custom_folders ? dadosVinculo.custom_folders.split(',').map(c => c.trim()).filter(Boolean) : []
  const listaCategorias = ['documentos', 'exercicios', ...customFoldersList]

  const totalFiles = dadosVinculo?.arquivos?.length || 0
  const totalDownloaded = dadosVinculo?.arquivos?.filter(a => localStorage.getItem('baixado_' + a.drive_file_id) === 'true')?.length || 0
  const totalPending = totalFiles - totalDownloaded

  return (
    <div className="space-y-6">
      {classroom.isFileSystemSupported && !classroom.directoryHandle && (
        <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            Modo offline desativado. Vincule uma pasta de estudos nas <a href="/configuracoes" className="text-primary hover:underline font-bold">Configurações Gerais</a> para acessar arquivos offline.
          </p>
        </div>
      )}

      {classroom.isFileSystemSupported && classroom.directoryHandle && !classroom.hasFolderPermission && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
            Acesso à pasta local <span className="font-bold text-primary">{classroom.directoryHandle.name}</span> suspenso pelo navegador nesta sessão.
          </p>
          <button onClick={classroom.solicitarAcessoPasta} className="h-8 px-4 bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-lg text-[10px] shadow-sm transition-opacity uppercase tracking-wider shrink-0 cursor-pointer">
            Reautorizar Acesso
          </button>
        </div>
      )}

      <BarraFiltrosCompacta
        searchText={filtros.searchText}
        setSearchText={filtros.setSearchText}
        selectedExtension={filtros.selectedExtension}
        setSelectedExtension={filtros.setSelectedExtension}
        selectedStatus={filtros.selectedStatus}
        setSelectedStatus={filtros.setSelectedStatus}
        mostrarOcultados={filtros.mostrarOcultados}
        setMostrarOcultados={filtros.setMostrarOcultados}
        isFileSystemSupported={classroom.isFileSystemSupported && !!classroom.directoryHandle && classroom.hasFolderPermission}
        onLimparFiltros={filtros.limparFiltros}
        onAdicionarArquivo={() => { acoes.setUploadCategory(listaCategorias[0] || 'documentos'); acoes.setUploadModalAberto(true); }}
        temFiltrosAtivos={filtros.temFiltros}
        desabilitarAdicionar={classroom.isFileSystemSupported && (!classroom.directoryHandle || !classroom.hasFolderPermission)}
      />

      <GradeCategoriasArquivos
        arquivosOrdenados={filtros.arquivosOrdenados}
        listaCategorias={listaCategorias}
        missingFiles={missingFiles}
        hasFolderPermission={classroom.hasFolderPermission}
        isFileSystemSupported={classroom.isFileSystemSupported && !!classroom.directoryHandle && classroom.hasFolderPermission}
        downloadProgress={acoes.downloadProgress}
        onPreVisualizar={lidarComPreVisualizacao}
        onAlternarOcultar={acoes.alternarOcultar}
        onExcluirLocal={acoes.setArquivoParaExcluir}
        onBaixarLocal={acoes.gerenciarDownload}
        onSalvarNome={acoes.salvarNome}
        onAlterarPastaDestino={acoes.alterarPasta}
        onReordenarManual={lidarComReordenacaoManual}
      />

      <PainelEstatisticasLegenda
        totalFiles={totalFiles}
        totalDownloaded={totalDownloaded}
        totalPending={totalPending}
        isFileSystemSupported={classroom.isFileSystemSupported && !!classroom.directoryHandle && classroom.hasFolderPermission}
      />

      <ModalUploadLocal
        isOpen={acoes.uploadModalAberto}
        onClose={() => { acoes.setUploadModalAberto(false); acoes.setUploadFile(null); }}
        onSubmit={acoes.gerenciarUploadLocal}
        uploadCategory={acoes.uploadCategory}
        setUploadCategory={acoes.setUploadCategory}
        uploadFile={acoes.uploadFile}
        setUploadFile={acoes.setUploadFile}
        listaCategorias={listaCategorias}
        enviando={acoes.enviando}
      />

      <ModalConfirmarExclusaoLocal
        isOpen={!!acoes.arquivoParaExcluir}
        onClose={() => acoes.setArquivoParaExcluir(null)}
        onConfirm={acoes.confirmarExclusaoFisica}
      />

      <ModalVisualizadorIframe
        arquivo={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={acoes.gerenciarDownload}
        isFileSystemSupported={classroom.isFileSystemSupported && !!classroom.directoryHandle && classroom.hasFolderPermission}
      />
    </div>
  )
}

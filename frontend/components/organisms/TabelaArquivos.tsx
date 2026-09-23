'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusVinculoClassroom, ArquivoClassroom } from '@/lib/api/classroom'
import { useGradeArquivos } from './useGradeArquivos'
import { useMovimentacaoArquivos } from '@/lib/hooks/useMovimentacaoArquivos'
import { BarraFiltrosCompacta } from '@/components/molecules/BarraFiltrosCompacta'
import { GradeCategoriasArquivos } from './GradeCategoriasArquivos'
import { PainelEstatisticasLegenda } from './PainelEstatisticasLegenda'
import { AvisosAcessoPasta } from '@/components/molecules/AvisosAcessoPasta'
import { ModaisTabelaArquivos } from '@/components/molecules/ModaisTabelaArquivos'

interface TabelaArquivosProps {
  materiaId: number
  anoId: number
  dadosVinculo: StatusVinculoClassroom
}

export function TabelaArquivos({ materiaId, anoId, dadosVinculo }: TabelaArquivosProps) {
  const router = useRouter()
  const { classroom, missingFiles, filtros, acoes } = useGradeArquivos(materiaId, anoId, dadosVinculo)
  const [previewFile, setPreviewFile] = useState<ArquivoClassroom | null>(null)

  const customFoldersList = dadosVinculo?.custom_folders ? dadosVinculo.custom_folders.split(',').map(c => c.trim()).filter(Boolean) : []
  const listaCategorias = ['documentos', 'exercicios', ...customFoldersList]

  const { lidarComMovimentacaoArquivo } = useMovimentacaoArquivos({
    materiaId,
    arquivosOrdenados: filtros.arquivosOrdenados,
    listaCategorias,
    setOrdemManualVersao: filtros.setOrdemManualVersao,
    alterarPasta: acoes.alterarPasta
  })

  const lidarComPreVisualizacao = (arquivo: ArquivoClassroom) => {
    const ext = arquivo.original_name.split('.').pop()?.toLowerCase() || ''
    const formats = ['pdf', 'mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp', 'txt', 'py', 'js', 'ts', 'html', 'css', 'json', 'md', 'java', 'cpp', 'c', 'sql', 'sh', 'yml', 'yaml', 'doc', 'docx']
    if (formats.includes(ext)) router.push(`/disciplinas/${materiaId}/arquivos/visualizador?fileId=${arquivo.drive_file_id}`)
    else if (!arquivo.drive_file_id.startsWith('local_') && !arquivo.drive_file_id.startsWith('LOCAL_')) setPreviewFile(arquivo)
  }

  const isFsReady = classroom.isFileSystemSupported && !!classroom.directoryHandle && classroom.hasFolderPermission
  const totalFiles = dadosVinculo?.arquivos?.length || 0
  const totalDownloaded = dadosVinculo?.arquivos?.filter(a => localStorage.getItem('baixado_' + a.drive_file_id) === 'true')?.length || 0

  return (
    <div className="space-y-6">
      <AvisosAcessoPasta isFileSystemSupported={classroom.isFileSystemSupported} directoryHandle={classroom.directoryHandle} hasFolderPermission={classroom.hasFolderPermission} onSolicitarAcesso={classroom.solicitarAcessoPasta} />
      <BarraFiltrosCompacta
        searchText={filtros.searchText} setSearchText={filtros.setSearchText}
        selectedExtension={filtros.selectedExtension} setSelectedExtension={filtros.setSelectedExtension}
        selectedStatus={filtros.selectedStatus} setSelectedStatus={filtros.setSelectedStatus}
        mostrarOcultados={filtros.mostrarOcultados} setMostrarOcultados={filtros.setMostrarOcultados}
        isFileSystemSupported={isFsReady} onLimparFiltros={filtros.limparFiltros}
        onAdicionarArquivo={() => { acoes.setUploadCategory(listaCategorias[0] || 'documentos'); acoes.setUploadModalAberto(true); }}
        temFiltrosAtivos={filtros.temFiltros} desabilitarAdicionar={classroom.isFileSystemSupported && (!classroom.directoryHandle || !classroom.hasFolderPermission)}
      />
      <GradeCategoriasArquivos
        arquivosOrdenados={filtros.arquivosOrdenados} listaCategorias={listaCategorias} missingFiles={missingFiles}
        hasFolderPermission={classroom.hasFolderPermission} isFileSystemSupported={isFsReady} downloadProgress={acoes.downloadProgress}
        onPreVisualizar={lidarComPreVisualizacao} onAlternarOcultar={acoes.alternarOcultar} onExcluirLocal={acoes.setArquivoParaExcluir}
        onBaixarLocal={acoes.gerenciarDownload} onSalvarNome={acoes.salvarNome} onMoverArquivo={lidarComMovimentacaoArquivo}
      />
      <PainelEstatisticasLegenda totalFiles={totalFiles} totalDownloaded={totalDownloaded} totalPending={totalFiles - totalDownloaded} isFileSystemSupported={isFsReady} />
      <ModaisTabelaArquivos
        uploadModalAberto={acoes.uploadModalAberto} setUploadModalAberto={acoes.setUploadModalAberto}
        uploadCategory={acoes.uploadCategory} setUploadCategory={acoes.setUploadCategory}
        uploadFile={acoes.uploadFile} setUploadFile={acoes.setUploadFile}
        listaCategorias={listaCategorias} enviando={acoes.enviando} onGerenciarUploadLocal={acoes.gerenciarUploadLocal}
        arquivoParaExcluir={acoes.arquivoParaExcluir} setArquivoParaExcluir={acoes.setArquivoParaExcluir}
        onConfirmarExclusaoFisica={acoes.confirmarExclusaoFisica} previewFile={previewFile} setPreviewFile={setPreviewFile}
        onGerenciarDownload={acoes.gerenciarDownload} isFileSystemSupported={isFsReady}
      />
    </div>
  )
}

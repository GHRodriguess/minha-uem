'use client'

import React from 'react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { ModalUploadLocal } from '@/components/molecules/ModalUploadLocal'
import { ModalConfirmarExclusaoLocal } from '@/components/molecules/ModalConfirmarExclusaoLocal'
import { ModalVisualizadorIframe } from '@/components/molecules/ModalVisualizadorIframe'

interface ModaisTabelaArquivosProps {
  uploadModalAberto: boolean
  setUploadModalAberto: (aberto: boolean) => void
  uploadCategory: string
  setUploadCategory: (cat: string) => void
  uploadFile: File | null
  setUploadFile: (file: File | null) => void
  listaCategorias: string[]
  enviando: boolean
  onGerenciarUploadLocal: (e: React.FormEvent) => Promise<void>
  arquivoParaExcluir: ArquivoClassroom | null
  setArquivoParaExcluir: (arq: ArquivoClassroom | null) => void
  onConfirmarExclusaoFisica: () => Promise<void>
  previewFile: ArquivoClassroom | null
  setPreviewFile: (arq: ArquivoClassroom | null) => void
  onGerenciarDownload: (arq: ArquivoClassroom) => Promise<void>
  isFileSystemSupported: boolean
}

export function ModaisTabelaArquivos({
  uploadModalAberto,
  setUploadModalAberto,
  uploadCategory,
  setUploadCategory,
  uploadFile,
  setUploadFile,
  listaCategorias,
  enviando,
  onGerenciarUploadLocal,
  arquivoParaExcluir,
  setArquivoParaExcluir,
  onConfirmarExclusaoFisica,
  previewFile,
  setPreviewFile,
  onGerenciarDownload,
  isFileSystemSupported
}: ModaisTabelaArquivosProps) {
  return (
    <>
      <ModalUploadLocal
        isOpen={uploadModalAberto}
        onClose={() => {
          setUploadModalAberto(false)
          setUploadFile(null)
        }}
        onSubmit={onGerenciarUploadLocal}
        uploadCategory={uploadCategory}
        setUploadCategory={setUploadCategory}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        listaCategorias={listaCategorias}
        enviando={enviando}
      />

      <ModalConfirmarExclusaoLocal
        isOpen={!!arquivoParaExcluir}
        onClose={() => setArquivoParaExcluir(null)}
        onConfirm={onConfirmarExclusaoFisica}
      />

      <ModalVisualizadorIframe
        arquivo={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={onGerenciarDownload}
        isFileSystemSupported={isFileSystemSupported}
      />
    </>
  )
}

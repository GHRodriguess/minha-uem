'use client'

import React, { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'
import { StatusArquivo } from '@/components/atoms/StatusArquivo'
import { obterNomeExibicao } from '@/lib/utils/formatadorNomeArquivo'

interface CampoNomeArquivoProps {
  arquivo: ArquivoClassroom
  isFileSystemSupported: boolean
  isReallyDownloaded: boolean
  onSalvarNome: (arq: ArquivoClassroom, novoNome: string) => Promise<void>
}

export function CampoNomeArquivo({
  arquivo,
  isFileSystemSupported,
  isReallyDownloaded,
  onSalvarNome
}: CampoNomeArquivoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(obterNomeExibicao(arquivo.custom_name, arquivo.original_name))

  const lidarComConfirmacao = async () => {
    if (tempName.trim()) {
      await onSalvarNome(arquivo, tempName.trim())
      setIsEditing(false)
    }
  }

  const iniciarEdicao = () => {
    setTempName(obterNomeExibicao(arquivo.custom_name, arquivo.original_name))
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <input
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          className="h-7 px-2 border border-border rounded-lg bg-background text-[11px] font-bold w-48 focus:outline-none text-foreground"
          autoFocus
        />
        <button onClick={lidarComConfirmacao} className="p-1 rounded-md bg-emerald-500 text-white cursor-pointer">
          <Check className="w-3 h-3" />
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1 rounded-md bg-muted text-muted-foreground cursor-pointer">
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 flex items-center gap-2">
      <div className="flex items-center gap-2 group/name max-w-xl min-w-0">
        <p
          className="font-bold text-foreground text-[11px] truncate leading-tight cursor-pointer hover:text-primary transition-colors"
          onDoubleClick={iniciarEdicao}
        >
          {obterNomeExibicao(arquivo.custom_name, arquivo.original_name)}
        </p>
        <button
          onClick={iniciarEdicao}
          className="opacity-0 group-hover/name:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Edit2 className="w-2.5 h-2.5" />
        </button>
      </div>
      <StatusArquivo isFileSystemSupported={isFileSystemSupported} isReallyDownloaded={isReallyDownloaded} />
    </div>
  )
}

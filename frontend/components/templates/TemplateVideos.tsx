'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { academic_service } from '@/lib/api/academico'
import { Materia } from '@/types/academico'
import { GaleriaVideos } from '@/components/organisms/GaleriaVideos'
import Esqueleto from '@/components/atoms/Esqueleto'

interface TemplateVideosProps {
  materiaId: number
}

export function TemplateVideos({ materiaId }: TemplateVideosProps) {
  const { anoAtivoId, perfil } = useAcademico()
  const { data: session } = useSession()
  const { videosCache, loadingVideosStates, syncingVideosStates, obterVideos } = useClassroom()
  const localMateria = perfil?.materias?.find(m => m.id === materiaId)
  const [materia, setMateria] = useState<Materia | null>(localMateria || null)

  const buscarMateria = useCallback(async () => {
    if (!session?.accessToken || !anoAtivoId) return
    try {
      const dados = await academic_service.obterMateria(session.accessToken, materiaId, anoAtivoId)
      if (dados) setMateria(dados)
    } catch (e) {
      console.error(e)
    }
  }, [session, anoAtivoId, materiaId])

  useEffect(() => {
    buscarMateria()
  }, [buscarMateria])

  useEffect(() => {
    if (anoAtivoId) obterVideos(materiaId, anoAtivoId, false)
  }, [materiaId, anoAtivoId, obterVideos])

  const forcarSincronizacao = async () => {
    if (anoAtivoId) await obterVideos(materiaId, anoAtivoId, true)
  }

  const dadosVinculo = videosCache[materiaId]
  const carregando = loadingVideosStates[materiaId]
  const sincronizando = syncingVideosStates[materiaId]
  const estaVinculado = dadosVinculo?.vinculado

  if (!materia) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center space-y-4">
        <Esqueleto className="h-10 w-48 mx-auto" />
        <p className="text-muted-foreground text-xs font-medium">Carregando detalhes da disciplina...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-4">
        <Link href={`/disciplinas/${materiaId}`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar para {materia.nome}
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase mb-2 inline-block">
              Gravações e Vídeo Aulas
            </span>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Vídeo Aulas do Classroom</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">{materia.nome} • {materia.codigo}</p>
          </div>
          {estaVinculado && (
            <button onClick={forcarSincronizacao} disabled={sincronizando} className="flex items-center justify-center gap-2 h-10 px-5 bg-card border border-border hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar Vídeos'}
            </button>
          )}
        </div>
      </div>

      {!estaVinculado && !carregando ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-md font-bold text-foreground">Google Classroom não vinculado</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Vincule uma turma do Google Classroom nas configurações da disciplina para poder assistir às vídeo aulas.
          </p>
        </div>
      ) : (
        <GaleriaVideos materiaId={materiaId} videos={dadosVinculo?.videos || []} carregando={carregando} />
      )}
    </div>
  )
}

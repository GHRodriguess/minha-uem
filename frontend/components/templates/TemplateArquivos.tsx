'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, 
  Loader2, 
  AlertTriangle,
  Folder,
  CloudLightning,
  FileCheck2,
  HardDriveDownload,
  School,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { academic_service } from '@/lib/api/academico'
import { Materia } from '@/types/academico'
import { StatusVinculoClassroom } from '@/lib/api/classroom'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { TabelaArquivos } from '@/components/organisms/TabelaArquivos'

interface TemplateArquivosProps {
  materiaId: number
}

export function TemplateArquivos({ materiaId }: TemplateArquivosProps) {
  const { anoAtivoId } = useAcademico()
  const { data: session } = useSession()
  const router = useRouter()
  const { 
    filesCache,
    loadingStates,
    syncingStates,
    obterArquivos
  } = useClassroom()

  const [materia, setMateria] = useState<Materia | null>(null)
  const [loadingMateria, setLoadingMateria] = useState(true)

  const buscarDadosMateria = useCallback(async () => {
    if (!session?.accessToken || !anoAtivoId) return
    
    setLoadingMateria(true)
    try {
      const profile = await academic_service.obterPerfil(session.accessToken, anoAtivoId)
      const foundSubject = profile.materias?.find(m => m.id === materiaId)
      if (foundSubject) {
        setMateria(foundSubject)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingMateria(false)
    }
  }, [session, anoAtivoId, materiaId])

  useEffect(() => {
    buscarDadosMateria()
  }, [anoAtivoId, materiaId, buscarDadosMateria])

  useEffect(() => {
    if (anoAtivoId) {
      obterArquivos(materiaId, anoAtivoId, false)
    }
  }, [anoAtivoId, materiaId, obterArquivos])

  const dispararSincronizacao = async () => {
    if (!anoAtivoId) return
    await obterArquivos(materiaId, anoAtivoId, true)
  }

  const isLoading = loadingMateria || (loadingStates[materiaId] && !filesCache[materiaId])
  const isSyncing = syncingStates[materiaId]
  const dadosVinculo = filesCache[materiaId]

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Buscando materiais da disciplina...</p>
      </div>
    )
  }

  if (!materia) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive opacity-30" />
        <h2 className="text-2xl font-bold text-foreground">Disciplina não encontrada</h2>
        <Link href="/disciplinas" className="text-primary hover:underline mt-4 inline-block font-bold">
          Voltar para lista
        </Link>
      </div>
    )
  }

  if (!session?.googleAccessToken) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link 
          href={`/disciplinas/${materiaId}`}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para {materia.nome}
        </Link>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3 text-amber-500">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Google Classroom desconectado</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Você precisa se conectar com o seu e-mail institucional @uem.br para poder visualizar e gerenciar os materiais e arquivos do Google Classroom vinculados a esta disciplina.
          </p>
          <button
            onClick={() => router.push('/configuracoes')}
            className="h-10 px-5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 shadow-sm transition-opacity inline-flex items-center gap-2"
          >
            Acessar Configurações
          </button>
        </div>
      </div>
    )
  }

  const isVinculado = dadosVinculo?.vinculado
  const totalArquivos = dadosVinculo?.arquivos?.length || 0
  const totalBaixados = dadosVinculo?.arquivos?.filter(a => localStorage.getItem('baixado_' + a.drive_file_id) === 'true')?.length || 0
  const totalPendentes = totalArquivos - totalBaixados

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <section className="flex flex-col gap-4">
        <Link 
          href={`/disciplinas/${materiaId}`}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para {materia.nome}
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">
                Materiais de Estudo
              </span>
              {isVinculado && dadosVinculo?.classroom_course_name && (
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Vinculado a: {dadosVinculo.classroom_course_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Arquivos e Documentos</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">{materia.nome} • {materia.codigo}</p>
          </div>

          {isVinculado && (
            <button
              onClick={dispararSincronizacao}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 h-10 px-5 bg-card border border-border hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Arquivos'}
            </button>
          )}
        </div>
      </section>

      {!isVinculado ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <School className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Google Classroom não vinculado</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              Nenhuma turma do Classroom está vinculada a esta disciplina. Você pode realizar a vinculação na tela principal da disciplina para sincronizar todos os materiais automaticamente.
            </p>
          </div>
          <Link 
            href={`/disciplinas/${materiaId}`}
            className="inline-flex items-center justify-center h-10 px-6 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold shadow-sm transition-opacity"
          >
            Ir para Tela da Disciplina
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total de Arquivos</p>
                <p className="text-2xl font-black text-foreground">{totalArquivos}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Arquivos Baixados</p>
                <p className="text-2xl font-black text-foreground">{totalBaixados}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                <HardDriveDownload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Disponíveis no Drive</p>
                <p className="text-2xl font-black text-foreground">{totalPendentes}</p>
              </div>
            </div>
          </div>

          <TabelaArquivos
            materiaId={materiaId}
            anoId={anoAtivoId || 0}
            dadosVinculo={dadosVinculo}
          />
        </div>
      )}
    </div>
  )
}

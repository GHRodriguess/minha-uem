'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, 
  AlertTriangle,
  Folder,
  FileCheck2,
  HardDriveDownload,
  School,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import CarregamentoArquivos from '@/components/templates/CarregamentoArquivos'
import Esqueleto from '@/components/atoms/Esqueleto'
import { academic_service } from '@/lib/api/academico'
import { Materia } from '@/types/academico'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { TabelaArquivos } from '@/components/organisms/TabelaArquivos'
import { ModalGerenciarCategorias } from '@/components/molecules/ModalGerenciarCategorias'
import { ModalConfirmarExclusaoCategoria } from '@/components/molecules/ModalConfirmarExclusaoCategoria'

interface TemplateArquivosProps {
  materiaId: number
}

export function TemplateArquivos({ materiaId }: TemplateArquivosProps) {
  const { anoAtivoId, perfil } = useAcademico()
  const { data: session } = useSession()
  const router = useRouter()
  const { 
    filesCache,
    loadingStates,
    syncingStates,
    obterArquivos,
    atualizarCategoriasMateria
  } = useClassroom()

  const localSubject = perfil?.materias?.find(m => m.id === materiaId)
  const [materia, setMateria] = useState<Materia | null>(localSubject || null)
  const [isSubjectLoading, setIsSubjectLoading] = useState(!localSubject)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState('')

  const lidarComAdicaoCategoria = async (novaCat: string) => {
    if (!linkedData) return
    const currentFolders = linkedData.custom_folders
      ? linkedData.custom_folders.split(',').map(c => c.trim()).filter(Boolean)
      : []
    if (!currentFolders.includes(novaCat)) {
      const newFolders = [...currentFolders, novaCat].join(',')
      await atualizarCategoriasMateria(materiaId, anoAtivoId || 0, newFolders, [])
    }
  }

  const lidarComExclusaoCategoria = (nomeCat: string) => {
    if (!linkedData) return
    const folderFiles = linkedData.arquivos.filter(a => a.selected_folder === nomeCat)
    if (folderFiles.length > 0) {
      setCategoryToDelete(nomeCat)
      setIsDeleteModalOpen(true)
    } else {
      executarExclusaoSemArquivos(nomeCat)
    }
  }

  const executarExclusaoSemArquivos = async (nomeCat: string) => {
    if (!linkedData) return
    const currentFolders = linkedData.custom_folders
      ? linkedData.custom_folders.split(',').map(c => c.trim()).filter(Boolean)
      : []
    const newFolders = currentFolders.filter(c => c !== nomeCat).join(',')
    await atualizarCategoriasMateria(materiaId, anoAtivoId || 0, newFolders, [])
  }

  const lidarComConfirmacaoExclusao = async (destino: string) => {
    if (!linkedData || !categoryToDelete) return
    const currentFolders = linkedData.custom_folders
      ? linkedData.custom_folders.split(',').map(c => c.trim()).filter(Boolean)
      : []
    const newFolders = currentFolders.filter(c => c !== categoryToDelete).join(',')

    const folderFiles = linkedData.arquivos.filter(a => a.selected_folder === categoryToDelete)
    const folderRedistributions = folderFiles.map(a => ({
      drive_file_id: a.drive_file_id,
      new_folder: destino
    }))

    await atualizarCategoriasMateria(materiaId, anoAtivoId || 0, newFolders, folderRedistributions)
    setIsDeleteModalOpen(false)
    setCategoryToDelete('')
  }

  const buscarDadosMateria = useCallback(async () => {
    if (!session?.accessToken || !anoAtivoId) return
    
    const isSilent = !!localSubject
    if (!isSilent) {
      setIsSubjectLoading(true)
    }
    try {
      const foundSubject = await academic_service.obterMateria(session.accessToken, materiaId, anoAtivoId)
      if (foundSubject) {
        setMateria(foundSubject)
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (!isSilent) {
        setIsSubjectLoading(false)
      }
    }
  }, [session, anoAtivoId, materiaId, localSubject])

  useEffect(() => {
    buscarDadosMateria()
  }, [anoAtivoId, materiaId, buscarDadosMateria])

  useEffect(() => {
    if (localSubject && !materia) {
      setMateria(localSubject)
      setIsSubjectLoading(false)
    }
  }, [localSubject, materia])

  useEffect(() => {
    if (anoAtivoId) {
      obterArquivos(materiaId, anoAtivoId, false)
    }
  }, [anoAtivoId, materiaId, obterArquivos])

  const dispararSincronizacao = async () => {
    if (!anoAtivoId) return
    await obterArquivos(materiaId, anoAtivoId, true)
  }

  const isLoading = isSubjectLoading && !localSubject
  const isSyncing = syncingStates[materiaId]
  const linkedData = filesCache[materiaId]
  const areFilesLoading = loadingStates[materiaId] && !linkedData

  if (isLoading) {
    return <CarregamentoArquivos />
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

  const isVinculado = linkedData?.vinculado
  const totalFiles = linkedData?.arquivos?.length || 0
  const totalDownloaded = linkedData?.arquivos?.filter(a => localStorage.getItem('baixado_' + a.drive_file_id) === 'true')?.length || 0
  const totalPending = totalFiles - totalDownloaded

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
              {(isVinculado || areFilesLoading) && linkedData?.classroom_course_name && (
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Vinculado a: {linkedData.classroom_course_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Arquivos e Documentos</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">{materia.nome} • {materia.codigo}</p>
          </div>

          {(isVinculado || areFilesLoading) && (
            <div className="flex gap-3">
              <button
                onClick={() => setIsManageModalOpen(true)}
                disabled={areFilesLoading}
                className="flex items-center justify-center gap-2 h-10 px-5 bg-card border border-border hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors disabled:opacity-50"
              >
                <Folder className="w-3.5 h-3.5 text-primary" />
                Gerenciar Categorias
              </button>
              <button
                onClick={dispararSincronizacao}
                disabled={isSyncing || areFilesLoading}
                className="flex items-center justify-center gap-2 h-10 px-5 bg-card border border-border hover:bg-muted text-xs font-bold text-muted-foreground rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || areFilesLoading ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : areFilesLoading ? 'Carregando...' : 'Sincronizar Arquivos'}
              </button>
            </div>
          )}
        </div>
      </section>

      {!isVinculado && !areFilesLoading ? (
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
                {areFilesLoading ? (
                  <Esqueleto className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-black text-foreground">{totalFiles}</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Arquivos Baixados</p>
                {areFilesLoading ? (
                  <Esqueleto className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-black text-foreground">{totalDownloaded}</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                <HardDriveDownload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Disponíveis no Drive</p>
                {areFilesLoading ? (
                  <Esqueleto className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-black text-foreground">{totalPending}</p>
                )}
              </div>
            </div>
          </div>

          {areFilesLoading ? (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <Esqueleto className="h-5 w-40" />
                <Esqueleto className="h-8 w-24 rounded-lg" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex items-center gap-4 py-3">
                    <Esqueleto className="w-8 h-8 rounded-lg animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <Esqueleto className="h-4 w-1/3" />
                      <Esqueleto className="h-3 w-1/4" />
                    </div>
                    <Esqueleto className="w-20 h-6 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <TabelaArquivos
              materiaId={materiaId}
              anoId={anoAtivoId || 0}
              dadosVinculo={linkedData}
            />
          )}
        </div>
      )}

      {isManageModalOpen && linkedData && (
        <ModalGerenciarCategorias
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          customFolders={
            linkedData.custom_folders
              ? linkedData.custom_folders.split(',').map(c => c.trim()).filter(Boolean)
              : []
          }
          onAddCategoria={lidarComAdicaoCategoria}
          onDeleteCategoria={lidarComExclusaoCategoria}
        />
      )}

      {isDeleteModalOpen && linkedData && (
        <ModalConfirmarExclusaoCategoria
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setCategoryToDelete('')
          }}
          categoriaNome={categoryToDelete}
          categoriasDestino={
            ['documentos', 'exercicios', ...(linkedData.custom_folders
              ? linkedData.custom_folders.split(',').map(c => c.trim()).filter(Boolean)
              : [])
            ].filter(c => c !== categoryToDelete)
          }
          onConfirm={lidarComConfirmacaoExclusao}
        />
      )}
    </div>
  )
}

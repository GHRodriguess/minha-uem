'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  classroom_service, 
  PostMuralClassroom, 
  AnexoClassroom 
} from '@/lib/api/classroom'
import { 
  Loader2, 
  MessageSquare, 
  FileText, 
  AlertCircle, 
  Link2, 
  Calendar, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Inbox
} from 'lucide-react'
import { useClassroom } from '../providers/ProvedorClassroom'

interface MuralClassroomProps {
  materiaId: number
  anoId: number
}

function YoutubeIconeCustomizado() {
  return (
    <svg className="w-4 h-4 text-destructive shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.516 3.5 12 3.5 12 3.5s-7.517 0-9.387.555A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.87.556 9.388.556 9.388.556s7.516 0 9.387-.556a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function obterIconeAnexo(tipo: AnexoClassroom['tipo']) {
  switch (tipo) {
    case 'drive':
      return <FileText className="w-4 h-4 text-primary" />
    case 'youtube':
      return <YoutubeIconeCustomizado />
    case 'form':
      return <FileText className="w-4 h-4 text-emerald-500" />
    case 'link':
    default:
      return <Link2 className="w-4 h-4 text-muted-foreground" />
  }
}

function obterEstiloPost(tipo: PostMuralClassroom['tipo']) {
  switch (tipo) {
    case 'tarefa':
      return {
        cardBorder: 'border-l-4 border-l-amber-500 border-border',
        badgeBg: 'bg-amber-500/10 text-amber-500',
        badgeLabel: 'Tarefa',
        icon: <FileText className="w-5 h-5 text-amber-500" />
      }
    case 'material':
      return {
        cardBorder: 'border-l-4 border-l-emerald-500 border-border',
        badgeBg: 'bg-emerald-500/10 text-emerald-500',
        badgeLabel: 'Material',
        icon: <BookIconeCustomizado />
      }
    case 'aviso':
    default:
      return {
        cardBorder: 'border-l-4 border-l-primary border-border',
        badgeBg: 'bg-primary/10 text-primary',
        badgeLabel: 'Aviso',
        icon: <MessageSquare className="w-5 h-5 text-primary" />
      }
  }
}

function BookIconeCustomizado() {
  return (
    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function CardMensagemMural({ post }: { post: PostMuralClassroom }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const styles = obterEstiloPost(post.tipo)
  const dateObj = new Date(post.data_criacao)
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const hasLongText = post.texto && post.texto.length > 280
  const renderedText = hasLongText && !isExpanded 
    ? post.texto?.substring(0, 280) + '...' 
    : post.texto

  const isDueActive = post.data_entrega ? new Date(post.data_entrega) > new Date() : false
  const formattedDueDate = post.data_entrega 
    ? new Date(post.data_entrega).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  return (
    <div className={`bg-card rounded-3xl border ${styles.cardBorder} p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80 relative`}>
      {post.nao_lido && (
        <span className="absolute top-6 right-6 flex h-6 px-3 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground uppercase tracking-widest animate-pulse">
          Novo
        </span>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="bg-muted p-3 rounded-2xl shrink-0">
          {styles.icon}
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${styles.badgeBg}`}>
              {styles.badgeLabel}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {formattedDate}
            </span>
          </div>
          {post.tipo !== 'aviso' && (
            <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
              {post.titulo}
            </h3>
          )}
        </div>
      </div>

      {post.texto && (
        <div className="space-y-3 mb-6">
          <p className="text-sm text-foreground/80 font-medium leading-relaxed whitespace-pre-wrap">
            {renderedText}
          </p>
          {hasLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 uppercase tracking-wider text-[10px]"
            >
              {isExpanded ? (
                <>Ocultar <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Ler completo <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      )}

      {post.data_entrega && formattedDueDate && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
          isDueActive 
            ? 'bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-500' 
            : 'bg-muted/50 border-border text-muted-foreground'
        }`}>
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-[10px]">
            Prazo de Entrega: <strong className="font-black">{formattedDueDate}</strong>
          </span>
        </div>
      )}

      {post.materiais && post.materiais.length > 0 && (
        <div className="border-t border-border pt-5 space-y-3">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Anexos e Links ({post.materiais.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {post.materiais.map((anexo, idx) => (
              <a
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted border border-border/40 hover:border-border transition-all group min-w-0"
              >
                <div className="bg-card p-2 rounded-xl shrink-0 border border-border/20 shadow-sm">
                  {obterIconeAnexo(anexo.tipo)}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {anexo.titulo}
                  </p>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                    {anexo.tipo === 'drive' ? 'Google Drive' : anexo.tipo === 'youtube' ? 'YouTube' : anexo.tipo === 'form' ? 'Google Forms' : 'Link Externo'}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MuralClassroom({ materiaId, anoId }: MuralClassroomProps) {
  const { data: session } = useSession()
  const { marcarMateriaLidaLocal } = useClassroom()
  const [posts, setPosts] = useState<PostMuralClassroom[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLinked, setIsLinked] = useState(true)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const buscarMural = useCallback(async (tokenPagina?: string | null) => {
    if (!session?.accessToken) return

    await Promise.resolve()

    const isFirstPage = !tokenPagina
    if (isFirstPage) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const googleToken = session.googleAccessToken || null
      const data = await classroom_service.obterMural(
        session.accessToken,
        googleToken,
        materiaId,
        anoId,
        tokenPagina
      )

      if (data) {
        setIsLinked(data.vinculado)
        if (data.vinculado) {
          if (isFirstPage) {
            setPosts(data.mural)
            marcarMateriaLidaLocal(materiaId)
          } else {
            setPosts(prev => {
              const existingIds = new Set(prev.map(p => p.id))
              const newPosts = data.mural.filter(p => !existingIds.has(p.id))
              return [...prev, ...newPosts]
            })
          }
          setNextPageToken(data.nextPageToken)
        }
      }
    } catch (err) {
      console.error('Erro ao obter mural do classroom:', err)
      setError('Não foi possível carregar as publicações do mural do Google Classroom no momento.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [session, materiaId, anoId, marcarMateriaLidaLocal])

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarMural()
    }, 0)
    return () => clearTimeout(timer)
  }, [buscarMural])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && nextPageToken && !loadingMore && !loading) {
          buscarMural(nextPageToken)
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [buscarMural, nextPageToken, loadingMore, loading])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">Carregando publicações do Classroom...</p>
      </div>
    )
  }

  if (!isLinked) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Mural do Google Classroom</h2>
          <p className="text-xs text-muted-foreground font-medium">Acompanhe os avisos, tarefas e materiais publicados pelo professor</p>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/5 border border-destructive/10 rounded-3xl p-8 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive opacity-30 mb-3" />
          <p className="text-sm font-bold text-destructive/80 mb-4">{error}</p>
          <button
            onClick={() => buscarMural()}
            className="h-10 px-5 bg-destructive text-destructive-foreground font-black text-xs rounded-xl hover:opacity-90 transition-opacity uppercase tracking-wider text-[10px]"
          >
            Tentar Novamente
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto select-none">
          <div className="bg-muted p-4 rounded-full w-fit mx-auto mb-4 text-muted-foreground/60">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Mural vazio</h3>
          <p className="text-xs text-muted-foreground font-medium">Nenhuma publicação foi encontrada no mural da sua turma no Classroom.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <CardMensagemMural key={post.id} post={post} />
            ))}
          </div>

          {nextPageToken && (
            <div ref={loaderRef} className="flex justify-center pt-6 pb-2 min-h-[48px]">
              {loadingMore && (
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Carregando mais publicações...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

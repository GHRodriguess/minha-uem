'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { NotebookPen, Plus, Trash2, Pencil, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { Materia, AnotacaoMateria } from '@/types/academico'
import { academic_service } from '@/lib/api/academico'

interface CardAnotacoesMateriaProps {
  materia: Materia
}

export function CardAnotacoesMateria({ materia }: CardAnotacoesMateriaProps) {
  const { data: session } = useSession()
  const [notesList, setNotesList] = useState<AnotacaoMateria[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | 'new' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (materia.configuracao_notas?.notes) {
      setNotesList(materia.configuracao_notas.notes)
    } else {
      setNotesList([])
    }
  }, [materia])

  const lidarComAdicao = async () => {
    if (!session?.accessToken || !materia.configuracao_notas?.id || !newContent.trim()) return

    setActionLoadingId('new')
    setErrorMsg(null)
    try {
      const response = await academic_service.criarAnotacao(
        session.accessToken,
        materia.configuracao_notas.id,
        newContent.trim()
      )
      setNotesList((prev) => [...prev, response])
      setNewContent('')
      setIsAdding(false)
    } catch (err) {
      console.error(err)
      setErrorMsg('Nao foi possivel adicionar o lembrete.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const lidarComAtualizacao = async (id: number) => {
    if (!session?.accessToken || !editingContent.trim()) return

    setActionLoadingId(id)
    setErrorMsg(null)
    try {
      const response = await academic_service.atualizarAnotacao(
        session.accessToken,
        id,
        editingContent.trim()
      )
      setNotesList((prev) =>
        prev.map((item) => (item.id === id ? response : item))
      )
      setEditingId(null)
      setEditingContent('')
    } catch (err) {
      console.error(err)
      setErrorMsg('Nao foi possivel atualizar o lembrete.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const lidarComExclusao = async (id: number) => {
    if (!session?.accessToken) return

    setActionLoadingId(id)
    setErrorMsg(null)
    try {
      await academic_service.excluirAnotacao(session.accessToken, id)
      setNotesList((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error(err)
      setErrorMsg('Nao foi possivel excluir o lembrete.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <NotebookPen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Minhas Anotações</h2>
            <p className="text-xs text-muted-foreground font-medium">Lembretes e notas da disciplina</p>
          </div>
        </div>

        {!isAdding && materia.configuracao_notas?.id && (
          <button
            onClick={() => {
              setIsAdding(true)
              setNewContent('')
              setErrorMsg(null)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-bold rounded-xl text-xs transition-colors shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 text-xs rounded-xl font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {notesList.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground font-medium">Você não possui anotações nesta matéria.</p>
            {materia.configuracao_notas?.id ? (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-3 text-xs font-bold text-primary hover:underline"
              >
                Criar o primeiro lembrete
              </button>
            ) : (
              <p className="mt-2 text-[10px] text-yellow-500 font-bold">
                Configure a média da disciplina para habilitar as anotações.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notesList.map((note) => (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between gap-4 p-5 bg-muted/20 rounded-2xl border border-border/50 hover:bg-muted/40 transition-colors min-h-35"
              >
                {editingId === note.id ? (
                  <div className="flex-col flex justify-between h-full w-full gap-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none flex-1 min-h-20"
                      placeholder="Edite seu lembrete..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => lidarComAtualizacao(note.id)}
                        disabled={actionLoadingId === note.id || !editingContent.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-xl text-[10px] hover:opacity-90 disabled:opacity-50 transition-opacity uppercase tracking-wider"
                      >
                        {actionLoadingId === note.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 font-bold rounded-xl text-[10px] transition-colors uppercase tracking-wider"
                      >
                        <X className="w-3 h-3" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground font-medium leading-relaxed whitespace-pre-wrap flex-1 wrap-break-words">
                      {note.content}
                    </p>

                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 justify-end mt-2 pt-2 border-t border-border/30">
                      <button
                        onClick={() => {
                          setEditingId(note.id)
                          setEditingContent(note.content)
                          setErrorMsg(null)
                        }}
                        disabled={actionLoadingId !== null}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => lidarComExclusao(note.id)}
                        disabled={actionLoadingId !== null}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {actionLoadingId === note.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isAdding && (
              <div className="p-5 bg-muted/30 rounded-2xl border border-primary/20 flex flex-col justify-between gap-3 min-h-35 animate-fade-in">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none flex-1 min-h-20"
                  placeholder="Digite seu lembrete..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={lidarComAdicao}
                    disabled={actionLoadingId === 'new' || !newContent.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-xl text-[10px] hover:opacity-90 disabled:opacity-50 transition-opacity uppercase tracking-wider"
                  >
                    {actionLoadingId === 'new' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 font-bold rounded-xl text-[10px] transition-colors uppercase tracking-wider"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

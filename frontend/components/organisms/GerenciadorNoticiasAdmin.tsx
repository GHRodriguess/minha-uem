'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { suporte_servico, Noticia } from '@/lib/api/suporte'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


interface GerenciadorNoticiasAdminProps {
  noticiaEmEdicao: Noticia | null
  onSucesso: () => void
  onCancelar: () => void
}

export default function GerenciadorNoticiasAdmin({ noticiaEmEdicao, onSucesso, onCancelar }: GerenciadorNoticiasAdminProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<'GERAL' | 'ACADEMICO' | 'CLASSROOM' | 'MANUTENCAO' | 'NOVIDADES'>('GERAL')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (noticiaEmEdicao) {
      setTitle(noticiaEmEdicao.title)
      setContent(noticiaEmEdicao.content)
      setCategory(noticiaEmEdicao.category)
    } else {
      setTitle('')
      setContent('')
      setCategory('GERAL')
    }
  }, [noticiaEmEdicao])

  const submeterFormulario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken || !title.trim() || !content.trim()) return
    setLoading(true)
    try {
      if (noticiaEmEdicao) {
        await suporte_servico.atualizarNoticia(session.accessToken, noticiaEmEdicao.id, title, content, category)
      } else {
        await suporte_servico.criarNoticia(session.accessToken, title, content, category)
      }
      onSucesso()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submeterFormulario} className="space-y-4 bg-muted/20 border border-border p-4 rounded-2xl animate-in fade-in duration-200">
      <h3 className="font-extrabold text-sm text-foreground">{noticiaEmEdicao ? "Editar Notícia" : "Criar Nova Notícia"}</h3>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Título</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded-xl text-xs h-9 bg-card border-border"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-card border border-border text-foreground text-xs rounded-xl h-9 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="GERAL">Geral</option>
            <option value="ACADEMICO">Acadêmico</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="MANUTENCAO">Manutenção</option>
            <option value="NOVIDADES">Novidades</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Conteúdo</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full px-3 py-2 bg-card border border-border text-foreground text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          className="text-[10px] font-bold rounded-xl h-9 px-4"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="text-[10px] font-bold rounded-xl h-9 px-4"
        >
          {noticiaEmEdicao ? "Salvar Alterações" : "Publicar Notícia"}
        </Button>
      </div>
    </form>
  )
}

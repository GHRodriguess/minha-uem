'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface FormularioNovoChamadoProps {
  onCriarChamado: (title: string, category: string, message: string) => Promise<void>
  onCancelar: () => void
}

export default function FormularioNovoChamado({ onCriarChamado, onCancelar }: FormularioNovoChamadoProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('OUTRO')
  const [message, setMessage] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    setCarregando(true)
    setErro('')
    try {
      await onCriarChamado(title, category, message)
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar chamado de suporte.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={handleEnviar} className="space-y-4">
      {erro && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Assunto do Chamado *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Erro ao carregar notas do Classroom"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all duration-200"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Categoria</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all duration-200"
        >
          <option value="INTERFACE">Problema Visual (Interface)</option>
          <option value="ACADEMICO">Notas / Faltas / Horários (Acadêmico)</option>
          <option value="CLASSROOM">Google Classroom</option>
          <option value="OUTRO">Outros Problemas</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Descrição do Problema *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Descreva detalhadamente o que ocorreu para que o suporte possa te ajudar..."
          rows={5}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-all duration-200 resize-none"
          required
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancelar} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" disabled={carregando} className="rounded-xl px-6 bg-primary text-primary-foreground hover:bg-primary/95">
          {carregando ? 'Enviando...' : 'Abrir Chamado'}
        </Button>
      </div>
    </form>
  )
}

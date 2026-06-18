'use client'

import { useState, useRef, useEffect } from 'react'
import { ChamadoSuporte, MensagemSuporte } from '@/lib/api/suporte'
import { Button } from '@/components/ui/button'
import { Send, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import useAutoRedimensionarTextArea from '@/lib/hooks/useAutoRedimensionarTextArea'

interface ChatSuporteProps {
  chamado: ChamadoSuporte
  usuarioEmail: string
  onEnviarMensagem: (message: string) => Promise<void>
  onResolverChamado?: () => Promise<void>
  adminMode?: boolean
}

export default function ChatSuporte({ chamado, usuarioEmail, onEnviarMensagem, onResolverChamado, adminMode = false }: ChatSuporteProps) {
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finalDoChatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useAutoRedimensionarTextArea(inputRef, novaMensagem)

  useEffect(() => {
    finalDoChatRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chamado.mensagens])

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim()) return
    setEnviando(true)
    try {
      await onEnviarMensagem(novaMensagem)
      setNovaMensagem('')
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setEnviando(false)
    }
  }

  const lidarComKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!enviando && novaMensagem.trim()) {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
        handleEnviar(fakeEvent)
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 bg-muted/40 border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-sm text-foreground line-clamp-1">{chamado.title}</h3>
          <p className="text-[11px] text-muted-foreground">
            {adminMode ? `Usuário: ${chamado.user_email}` : `Chamado #${chamado.id}`}
          </p>
        </div>
        {adminMode && chamado.status === 'ABERTO' && onResolverChamado && (
          <Button
            size="sm"
            onClick={onResolverChamado}
            className="rounded-xl flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Resolver</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {chamado.mensagens?.map((m: MensagemSuporte) => {
          const meu = adminMode ? m.sender_email !== chamado.user_email : m.sender_email === usuarioEmail
          return (
            <div key={m.id} className={clsx("flex flex-col max-w-[80%] rounded-2xl p-3 text-xs", meu ? "ml-auto bg-primary text-primary-foreground rounded-tr-none" : "mr-auto bg-muted text-foreground rounded-tl-none")}>
              {!meu && (
                <span className="font-bold text-[10px] text-muted-foreground mb-1 block">
                  {m.sender_username}
                </span>
              )}
              <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
              <span className="text-[9px] text-right mt-1 block opacity-70">
                {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={finalDoChatRef} />
      </div>

      {chamado.status === 'ABERTO' ? (
        <form onSubmit={handleEnviar} className="p-3 bg-muted/20 border-t border-border flex gap-2 items-end shrink-0">
          <textarea
            ref={inputRef}
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={lidarComKeyDown}
            placeholder="Digite sua resposta..."
            rows={1}
            className="flex-1 min-h-9.5 py-2 px-4 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:border-primary transition-all duration-200 resize-none whitespace-pre-wrap overflow-y-auto scrollbar-none"
            disabled={enviando}
            required
          />
          <Button type="submit" disabled={enviando || !novaMensagem.trim()} className="rounded-xl h-9 w-9 p-0 shrink-0 bg-primary text-primary-foreground hover:bg-primary/95">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <div className="p-4 bg-muted/30 border-t border-border text-center text-xs text-muted-foreground font-semibold shrink-0">
          Este chamado foi marcado como Resolvido.
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, Loader2, Sparkles, Brain, FileText, History, ArrowLeft } from 'lucide-react'
import { useChatIA } from '@/lib/hooks/useChatIA'
import { useConversasIA } from '@/lib/hooks/useConversasIA'
import BalaoMensagemIA from '../atoms/BalaoMensagemIA'
import SeletorArquivosIA from '../molecules/SeletorArquivosIA'
import FeedbackIADesativada from '../molecules/FeedbackIADesativada'
import SeletorModeloChatIA from '../molecules/SeletorModeloChatIA'
import ListaConversasIA from '../molecules/ListaConversasIA'
import { Button } from '@/components/ui/button'

interface SidebarChatProps { isOpen: boolean; onClose: () => void; layoutMode?: 'fixed' | 'integrated'; fileUrls?: Record<string, string> }

export default function SidebarChatIA({ isOpen, onClose, layoutMode = 'fixed', fileUrls }: SidebarChatProps) {
  const path = usePathname()
  const materiaId = path?.includes('/disciplinas/') ? Number(path.split('/disciplinas/')[1]?.split('/')[0]) : undefined
  const [isHistoryView, setIsHistoryView] = useState(false)

  const {
    conversas, conversaAtiva, setConversaAtiva, criarNovaConversa,
    excluirConversa, modelName, alterarModelo, loading
  } = useConversasIA(isOpen, materiaId)

  const {
    messages, input, setInput, sending, hasKey, selectedFileIds,
    chatEndRef, arquivosMateria, arquivosAbertos, alternarArquivo, enviarMensagem
  } = useChatIA(isOpen, fileUrls, conversaAtiva, criarNovaConversa)

  if (!isOpen) return null
  const containerClass = `${layoutMode === 'integrated' ? 'relative h-full w-105 bg-card shrink-0' : 'fixed inset-y-0 right-0 z-50 w-full sm:w-105 bg-card/95 shadow-2xl'} border-l border-border flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300`

  return (
    <div className={containerClass}>
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
        <div className="flex items-center gap-2">
          {isHistoryView ? (
            <button onClick={() => setIsHistoryView(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          ) : (
            <button onClick={() => setIsHistoryView(true)} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <History className="w-4 h-4 text-foreground" />
            </button>
          )}
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground truncate max-w-37.5">
            {isHistoryView ? 'Histórico de Chats' : (conversaAtiva?.title || 'Assistente Minha UEM')}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {hasKey && !isHistoryView && <SeletorModeloChatIA modelName={modelName} onChangeModel={alterarModelo} />}

      {!hasKey ? (
        <FeedbackIADesativada />
      ) : isHistoryView ? (
        <ListaConversasIA
          conversas={conversas}
          conversaAtiva={conversaAtiva}
          onSelecionar={(c) => {
            setConversaAtiva(c)
            setIsHistoryView(false)
          }}
          onExcluir={excluirConversa}
          onCriar={async () => {
            const nova = await criarNovaConversa()
            if (nova) setIsHistoryView(false)
          }}
          loading={loading}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Sparkles className="w-8 h-8 text-primary/40 mx-auto" />
                <p className="text-xs text-muted-foreground font-medium">Como posso te ajudar hoje?</p>
              </div>
            )}
            {messages.map((m, idx) => <BalaoMensagemIA key={idx} text={m.text} isUser={m.isUser} />)}
            {sending && (
              <div className="flex justify-start w-full">
                <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="font-semibold text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-background space-y-3">
            {arquivosAbertos.length > 0 && (
              <div className="space-y-1.5">
                {arquivosAbertos.map(f => (
                  <div key={f.drive_file_id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate flex-1">Documento: {f.custom_name || f.original_name}</span>
                    <span className="bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0">Auto-anexo</span>
                  </div>
                ))}
              </div>
            )}
            {materiaId && (
              <SeletorArquivosIA files={arquivosMateria} selectedIds={selectedFileIds} onToggle={alternarArquivo} />
            )}
            <form onSubmit={enviarMensagem} className="flex gap-2">
              <input
                type="text"
                placeholder={arquivosAbertos.length > 0 ? "Perguntar sobre os arquivos abertos..." : "Digite sua mensagem..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                className="flex-1 h-11 px-4 rounded-xl bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
              <Button type="submit" disabled={sending || !input.trim()} className="h-11 w-11 p-0 rounded-xl shrink-0">
                <Send className="w-4 h-4 text-primary-foreground" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

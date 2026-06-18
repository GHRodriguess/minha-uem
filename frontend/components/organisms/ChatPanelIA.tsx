'use client'

import { useRef } from 'react'
import { Send, Sparkles, Loader2, Plus, FileText, X, Menu } from 'lucide-react'
import { Conversa } from '@/lib/api/ia'
import BalaoMensagemIA from '../atoms/BalaoMensagemIA'
import useAutoRedimensionarTextArea from '@/lib/hooks/useAutoRedimensionarTextArea'


interface ChatPanelIAProps {
  conversaAtiva: Conversa | null
  messages: any[]
  input: string
  setInput: (val: string) => void
  sending: boolean
  enviarMensagem: (e: any) => Promise<void>
  modelName: string
  onChangeModel: (modelo: string) => void
  chatEndRef: any
  localUploads: Array<{ name: string; mime_type: string; base64_data: string }>
  adicionarUploadLocal: (file: { name: string; mime_type: string; base64_data: string }) => void
  removerUploadLocal: (index: number) => void
  onToggleSidebar: () => void
}

export default function ChatPanelIA({
  conversaAtiva,
  messages,
  input,
  setInput,
  sending,
  enviarMensagem,
  modelName,
  onChangeModel,
  chatEndRef,
  localUploads,
  adicionarUploadLocal,
  removerUploadLocal,
  onToggleSidebar
}: ChatPanelIAProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useAutoRedimensionarTextArea(inputRef, input)

  const lidarComSelecaoArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Data = reader.result as string
        const base64Content = base64Data.split(',')[1]
        adicionarUploadLocal({
          name: file.name,
          mime_type: file.type || 'application/octet-stream',
          base64_data: base64Content
        })
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const lidarComKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!sending && (input.trim() || localUploads.length > 0)) {
        enviarMensagem({ preventDefault: () => {} })
      }
    }
  }

  const handleSugestao = (texto: string) => {
    setInput(texto)
    inputRef.current?.focus()
  }

  const modelLabels: Record<string, string> = {
    'gemini-3.5-flash': 'Flash 3.5',
    'gemini-3.1-flash-lite': 'Lite 3.1',
    'gemini-2.5-flash': 'Flash 2.5',
    'gemini-2.5-pro': 'Pro 2.5'
  }

  return (
    <div className="flex-1 h-screen bg-background flex flex-col min-w-0 text-foreground relative">
      <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors md:hidden cursor-pointer shrink-0"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-foreground truncate pr-4">
            {conversaAtiva?.title || 'Novo Chat'}
          </span>
        </div>
        <select
          value={modelName}
          onChange={e => onChangeModel(e.target.value)}
          className="bg-muted/50 border border-border text-muted-foreground font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
        >
          {Object.entries(modelLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 min-h-0">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            <h2 className="text-xl font-extrabold text-foreground">Como posso te ajudar hoje?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
              {[
                'Faça um resumo em tópicos.',
                'Qual minha próxima prova ou trabalho?',
                'Ajude-me a estruturar a introdução do meu trabalho.',
                'Dê-me ideias de temas relevantes e atuais para meu TCC'
              ].map(sug => (
                <button
                  key={sug}
                  onClick={() => handleSugestao(sug)}
                  className="p-4 rounded-xl border border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all text-left cursor-pointer font-medium"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((m, idx) => (
              <BalaoMensagemIA key={idx} text={m.text} isUser={m.isUser} />
            ))}
            {sending && (
              <div className="flex justify-start w-full">
                <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="font-semibold text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background shrink-0 space-y-3">
        {localUploads.length > 0 && (
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
            {localUploads.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs animate-in fade-in duration-200">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate max-w-37.5 font-medium">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removerUploadLocal(idx)}
                  className="p-0.5 hover:bg-primary/20 rounded transition-colors text-primary/70 hover:text-primary cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="max-w-2xl mx-auto relative flex items-end gap-2 bg-muted/40 border border-border rounded-2xl px-3 py-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={lidarComSelecaoArquivo}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl shrink-0 cursor-pointer"
            title="Adicionar arquivo"
          >
            <Plus className="w-5 h-5" />
          </button>
          <textarea
            ref={inputRef}
            placeholder="Perguntar ao Gemini..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={lidarComKeyDown}
            disabled={sending}
            rows={1}
            className="flex-1 min-h-10 py-2.5 px-2 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50 resize-none whitespace-pre-wrap overflow-y-auto scrollbar-none"
          />
          <button
            type="button"
            onClick={() => enviarMensagem({ preventDefault: () => {} })}
            disabled={sending || (!input.trim() && localUploads.length === 0)}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-white disabled:bg-muted disabled:text-muted-foreground/40 transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

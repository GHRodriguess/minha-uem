'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FormularioChaveIAProps {
  apiKey: string
  setApiKey: (val: string) => void
  saving: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function FormularioChaveIA({
  apiKey,
  setApiKey,
  saving,
  onSubmit
}: FormularioChaveIAProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Chave de API do Gemini (Google)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            placeholder="Cole sua API Key aqui (começa com AIzaSy...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            className="flex-1 h-12 px-4 rounded-xl bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 font-mono"
          />
          <Button
            type="submit"
            disabled={saving || !apiKey.trim()}
            className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs gap-2 shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-primary-foreground" />
                Salvar e Ativar
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
        <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
          Como obter uma chave de API: Acesse o <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google AI Studio</a> com sua conta UEM, clique em &quot;Get API key&quot;, crie uma nova chave e cole-a acima. O uso dentro dos limites padrão é totalmente gratuito.
        </p>
      </div>
    </form>
  )
}

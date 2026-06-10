'use client'

import { EstatisticaUsoIA } from '@/lib/api/ia'

interface PainelModeloUsoIAProps {
  selectedModel: string
  onChangeModel: (modelo: string) => void
  usageToday: EstatisticaUsoIA[]
}

export default function PainelModeloUsoIA({
  selectedModel,
  onChangeModel,
  usageToday
}: PainelModeloUsoIAProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 min-w-0">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Chave de API Cadastrada
          </label>
          <div className="h-12 px-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-sm font-mono text-foreground opacity-60 min-w-0">
            <span className="truncate mr-2">••••••••••••••••</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
              Criptografada
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Modelo Ativo do Gemini
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onChangeModel(e.target.value)}
            className="h-12 w-full px-4 rounded-xl bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold"
          >
            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Padrão - Rápido)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Leve)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Equilibrado)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raciocínio Avançado)</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col gap-2">
        <h4 className="text-xs font-black text-primary uppercase tracking-wider">
          Limites de Cota Estimados (Google AI Studio)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-muted-foreground font-semibold">
          <div>• <strong>Modelos Flash/Lite:</strong> 15 RPM e 1.500 RPD</div>
          <div>• <strong>Modelos Pro:</strong> 2 RPM e 50 RPD</div>
        </div>
      </div>

      {usageToday.length > 0 && (
        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Uso das Cotas (Hoje)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usageToday.map((item) => {
              const limit = item.model_name.includes('pro') ? '50' : '1.500'
              return (
                <div key={item.model_name} className="p-4 rounded-2xl bg-muted/10 border border-border space-y-1">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wide truncate">
                    {item.model_name}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>Requisições:</span>
                    <span className="text-foreground">{item.requisicoes} / {limit} RPD</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>Tokens gastos:</span>
                    <span className="text-foreground">{item.total_tokens.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { Brain, Check, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfigIA } from '@/lib/hooks/useConfigIA'
import ModalConfirmarExclusaoChaveIA from '../molecules/ModalConfirmarExclusaoChaveIA'
import FormularioChaveIA from '../molecules/FormularioChaveIA'
import PainelModeloUsoIA from '../molecules/PainelModeloUsoIA'

export function CardIAConfig() {
  const {
    hasKey, apiKey, setApiKey, selectedModel, usageToday, loading, saving, removing,
    errorMessage, successMessage, showConfirmDelete, setShowConfirmDelete,
    salvarChave, alterarModelo, removerChave
  } = useConfigIA()

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Integração com Inteligência Artificial</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Configure sua chave pessoal da API do Gemini
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-muted/10 border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <h3 className="text-sm font-bold text-foreground">
                {hasKey ? 'Status: Ativo e Pronto' : 'Status: Desativado'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {hasKey 
                ? 'Sua chave de API do Gemini está configurada e protegida com criptografia no banco de dados.'
                : 'Insira sua chave do Google AI Studio para ativar as funcionalidades de IA em disciplinas e materiais.'}
            </p>
          </div>
          {hasKey && (
            <Button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              variant="outline"
              className="h-10 px-4 rounded-xl border-dashed border-destructive text-destructive hover:bg-destructive/5 text-xs font-black uppercase tracking-widest gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Chave
            </Button>
          )}
        </div>

        {(successMessage || errorMessage) && (
          <div className={`p-4 border rounded-2xl flex items-start gap-3 text-xs font-semibold ${
            successMessage 
              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-destructive/5 border-destructive/10 text-destructive'
          }`}>
            {successMessage ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
            {successMessage || errorMessage}
          </div>
        )}

        {!hasKey ? (
          <FormularioChaveIA apiKey={apiKey} setApiKey={setApiKey} saving={saving} onSubmit={salvarChave} />
        ) : (
          <PainelModeloUsoIA selectedModel={selectedModel} onChangeModel={alterarModelo} usageToday={usageToday} />
        )}
      </div>

      <ModalConfirmarExclusaoChaveIA
        isOpen={showConfirmDelete}
        onConfirm={removerChave}
        onCancel={() => setShowConfirmDelete(false)}
        loading={removing}
      />
    </div>
  )
}

'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModalConfirmarExclusaoChaveProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export default function ModalConfirmarExclusaoChaveIA({
  isOpen,
  onConfirm,
  onCancel,
  loading
}: ModalConfirmarExclusaoChaveProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex gap-3">
          <div className="bg-destructive/10 p-2.5 rounded-xl shrink-0">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Remover integração com IA?</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
              Ao remover a chave de API, todas as funcionalidades de chat, resumos de arquivos e consultas de notas via inteligência artificial serão desativadas imediatamente.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/95 text-destructive-foreground h-11 px-4 rounded-xl font-bold text-xs flex-1 uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar e Remover'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="h-11 px-4 rounded-xl font-bold text-xs flex-1 border-dashed uppercase tracking-wider"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

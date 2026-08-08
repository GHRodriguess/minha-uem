'use client'

import { useState } from 'react'
import { AlertTriangle, Layers, RefreshCw } from 'lucide-react'
import Modal from '../shared/Modal'
import { Button } from '../ui/button'

interface ModalConflitoHorarioProps {
  isOpen: boolean
  conflictYear: number | null
  pendingFileName?: string
  loading: boolean
  onClose: () => void
  onConfirm: (mode: 'mesclar' | 'recriar') => void
}

export function ModalConflitoHorario({
  isOpen,
  conflictYear,
  pendingFileName,
  loading,
  onClose,
  onConfirm
}: ModalConflitoHorarioProps) {
  const [confirmWipe, setConfirmWipe] = useState(false)

  const fecharModal = () => {
    setConfirmWipe(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={fecharModal}
      title={confirmWipe ? 'Atenção: Perda Permanente de Dados' : 'Opções de Importação de Horário'}
    >
      {!confirmWipe ? (
        <div className="flex flex-col gap-5">
          <div className="text-center space-y-1">
            <p className="text-foreground font-semibold text-lg">
              Já existem dados para o ano {conflictYear}
            </p>
            {pendingFileName && (
              <p className="text-sm text-muted-foreground bg-muted/60 py-1 px-3 rounded-lg inline-block">
                Arquivo: {pendingFileName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onConfirm('mesclar')}
              disabled={loading}
              className="flex flex-col items-start text-left p-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all gap-2 group"
            >
              <div className="flex items-center gap-2 text-primary font-bold">
                <Layers className="w-5 h-5" />
                <span>Mesclar Diferenças</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mantém matérias, notas e faltas atuais intactas. Adiciona matérias novas e atualiza horários.
              </p>
            </button>

            <button
              onClick={() => setConfirmWipe(true)}
              disabled={loading}
              className="flex flex-col items-start text-left p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all gap-2 group"
            >
              <div className="flex items-center gap-2 text-destructive font-bold">
                <RefreshCw className="w-5 h-5" />
                <span>Recriar do Zero</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Substitui a grade inteira. Apaga todas as faltas e notas registradas para o ano {conflictYear}.
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h4 className="text-foreground font-bold text-lg">Confirmar exclusão de dados</h4>
            <p className="text-sm text-muted-foreground max-w-md">
              Todas as faltas, anotações e configurações de notas salvas no ano {conflictYear} serão excluídas permanentemente.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmWipe(false)}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onConfirm('recriar')}
              disabled={loading}
            >
              Sim, Apagar Tudo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

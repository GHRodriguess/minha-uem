'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Modal from '../shared/Modal'
import CardUploadPDF from '../organisms/CardUploadPDF'
import { useSession } from 'next-auth/react'

interface BotaoNovoHorarioProps {
  onSuccess?: () => void
}

export default function BotaoNovoHorario({ onSuccess }: BotaoNovoHorarioProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const { data: session } = useSession()

  return (
    <>
      <Button
        onClick={() => setModalAberto(true)}
        variant="ghost"
        className="w-full justify-start gap-3 rounded-xl px-4 py-3 h-auto font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
      >
        <PlusCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        <span>Novo Horário</span>
      </Button>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Inserir Novo Horário"
      >
        <div className="p-1">
          <CardUploadPDF
            token={session?.accessToken || ''}
            onSuccess={() => {
              setModalAberto(false)
              if (onSuccess) onSuccess()
            }}
          />
        </div>
      </Modal>
    </>
  )
}

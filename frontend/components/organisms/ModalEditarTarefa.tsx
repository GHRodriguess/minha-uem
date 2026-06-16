'use client'

import { Avaliacao, Materia } from '@/types/academico'
import Modal from '../shared/Modal'
import FormTarefa from '../molecules/FormTarefa'

interface ModalEditarTarefaProps {
  isOpen: boolean
  onClose: () => void
  onSave: (materiaId: number, data: Partial<Avaliacao> & { id?: number }) => Promise<void>
  materias: Materia[]
  materiaPadraoId?: number
  avaliacao?: Avaliacao | null
  statusPadrao?: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO'
}

export default function ModalEditarTarefa({
  isOpen,
  onClose,
  onSave,
  materias,
  materiaPadraoId,
  avaliacao,
  statusPadrao = 'A_FAZER'
}: ModalEditarTarefaProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={avaliacao ? 'Editar Tarefa' : 'Nova Tarefa'}>
      <FormTarefa
        avaliacao={avaliacao}
        materias={materias}
        materiaPadraoId={materiaPadraoId}
        statusPadrao={statusPadrao}
        onSave={onSave}
        onCancel={onClose}
      />
    </Modal>
  )
}

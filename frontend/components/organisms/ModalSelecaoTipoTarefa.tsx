'use client'

import Modal from '../shared/Modal'
import { Avaliacao } from '@/types/academico'
import { GraduationCap, FolderKanban, FileCheck, ListTodo, Search, Sparkles } from 'lucide-react'

interface ModalSelecaoTipoTarefaProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (tipo: Avaliacao['tipo']) => void
}

const tipo_options: { id: Avaliacao['tipo']; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'PROVA', label: 'Prova', desc: 'Avaliação presencial ou online', icon: GraduationCap, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'TRABALHO', label: 'Trabalho', desc: 'Entrega individual ou em grupo', icon: FolderKanban, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'EXAME', label: 'Exame', desc: 'Exame final ou substitutiva', icon: FileCheck, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { id: 'TAREFA', label: 'Tarefa', desc: 'Exercício ou atividade contínua', icon: ListTodo, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'PESQUISA', label: 'Pesquisa', desc: 'Relatório ou artigo acadêmico', icon: Search, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'OUTRO', label: 'Outro', desc: 'Lembrete ou compromisso genérico', icon: Sparkles, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
]

export default function ModalSelecaoTipoTarefa({ isOpen, onClose, onSelectType }: ModalSelecaoTipoTarefaProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Qual o tipo da nova tarefa?">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
        {tipo_options.map((item) => {
          const Icone = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onSelectType(item.id)}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:bg-accent/40 transition-all text-left group"
            >
              <div className={`p-2.5 rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${item.color}`}>
                <Icone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</h4>
                <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

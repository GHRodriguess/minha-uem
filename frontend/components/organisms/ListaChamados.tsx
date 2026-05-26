'use client'

import { ChamadoSuporte } from '@/lib/api/suporte'
import { clsx } from 'clsx'

interface ListaChamadosProps {
  chamados: ChamadoSuporte[]
  chamadoSelecionadoId: number | null
  onSelecionarChamado: (id: number) => void
}

export default function ListaChamados({ chamados, chamadoSelecionadoId, onSelecionarChamado }: ListaChamadosProps) {
  const obterCategoriaFormatada = (cat: string) => {
    const nomes: Record<string, string> = {
      INTERFACE: 'Interface',
      ACADEMICO: 'Acadêmico',
      CLASSROOM: 'Google Classroom',
      OUTRO: 'Outro'
    }
    return nomes[cat] || cat
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
      {chamados.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado de suporte aberto.</p>
      ) : (
        chamados.map((c) => {
          const selecionado = c.id === chamadoSelecionadoId
          return (
            <div
              key={c.id}
              onClick={() => onSelecionarChamado(c.id)}
              className={clsx(
                "p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative overflow-hidden",
                selecionado
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-foreground hover:bg-muted/50"
              )}
            >
              {!c.read_by_user && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
              )}
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold text-sm line-clamp-1 pr-4">{c.title}</h4>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-muted font-medium text-foreground">
                  {obterCategoriaFormatada(c.category)}
                </span>
                <span className={clsx(
                  "font-semibold",
                  c.status === 'ABERTO' ? "text-amber-500" : "text-emerald-500"
                )}>
                  {c.status === 'ABERTO' ? 'Aberto' : 'Resolvido'}
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

'use client'

import { clsx } from 'clsx'

interface FiltroCategoriasNoticiasProps {
  categorias: string[]
  categoriaAtiva: string
  onSelecionarCategoria: (cat: string) => void
}

export default function FiltroCategoriasNoticias({
  categorias,
  categoriaAtiva,
  onSelecionarCategoria
}: FiltroCategoriasNoticiasProps) {
  return (
    <div className="flex flex-wrap gap-2 py-2 border-b border-border overflow-x-auto shrink-0 select-none">
      {categorias.map(cat => (
        <button
          key={cat}
          onClick={() => onSelecionarCategoria(cat)}
          className={clsx(
            "px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase transition-all duration-200 border",
            categoriaAtiva === cat
              ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
              : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

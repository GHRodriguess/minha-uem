'use client'

interface FiltrosCalendarioProps {
  filtros: {
    aulas: boolean
    avaliacoes: boolean
  }
  onChange: (novosFiltros: { aulas: boolean; avaliacoes: boolean }) => void
}

export function FiltrosCalendario({ filtros, onChange }: FiltrosCalendarioProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-4">Filtrar Visualização</h4>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={filtros.aulas} 
            onChange={(e) => onChange({ ...filtros, aulas: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Aulas</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={filtros.avaliacoes} 
            onChange={(e) => onChange({ ...filtros, avaliacoes: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Avaliações</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-yellow-500" />
        </label>
      </div>
    </div>
  )
}

'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface FiltroUsuariosAdminProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  roleFilter: 'TODOS' | 'STAFF' | 'ALUNOS'
  onRoleFilterChange: (val: 'TODOS' | 'STAFF' | 'ALUNOS') => void
  groupBy: 'NENHUM' | 'CURSO' | 'TIPO'
  onGroupByChange: (val: 'NENHUM' | 'CURSO' | 'TIPO') => void
  cursos: string[]
  selectedCurso: string
  onCursoChange: (val: string) => void
}

export default function FiltroUsuariosAdmin({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  groupBy,
  onGroupByChange,
  cursos,
  selectedCurso,
  onCursoChange
}: FiltroUsuariosAdminProps) {
  return (
    <div className="bg-card border border-border p-4 rounded-2xl gap-4 flex flex-col md:flex-row md:items-center justify-between shrink-0">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar por nome, username ou email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-xl text-xs h-9 bg-muted/20 border-border w-full"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">Cargo</label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value as any)}
            className="bg-muted/20 border border-border text-foreground text-[11px] rounded-xl h-9 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
          >
            <option value="TODOS">Todos</option>
            <option value="STAFF">Administradores</option>
            <option value="ALUNOS">Alunos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">Curso</label>
          <select
            value={selectedCurso}
            onChange={(e) => onCursoChange(e.target.value)}
            className="bg-muted/20 border border-border text-foreground text-[11px] rounded-xl h-9 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
          >
            <option value="TODOS">Todos Cursos</option>
            {cursos.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-muted-foreground uppercase">Agrupar Por</label>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as any)}
            className="bg-muted/20 border border-border text-foreground text-[11px] rounded-xl h-9 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
          >
            <option value="NENHUM">Sem Agrupamento</option>
            <option value="CURSO">Curso</option>
            <option value="TIPO">Tipo de Conta</option>
          </select>
        </div>
      </div>
    </div>
  )
}

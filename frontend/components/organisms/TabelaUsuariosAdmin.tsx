'use client'

import React, { useState, useMemo } from 'react'
import { UsuarioAdminDet } from '@/lib/api/suporte'
import { ChevronDown, ChevronUp } from 'lucide-react'
import DetalheUsuarioAdmin from '../molecules/DetalheUsuarioAdmin'
import FiltroUsuariosAdmin from '../molecules/FiltroUsuariosAdmin'

interface TabelaUsuariosAdminProps {
  usuarios: UsuarioAdminDet[]
  onUsuarioAlterado?: () => void
}

export default function TabelaUsuariosAdmin({ usuarios, onUsuarioAlterado }: TabelaUsuariosAdminProps) {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'TODOS' | 'STAFF' | 'ALUNOS'>('TODOS')
  const [selectedCurso, setSelectedCurso] = useState('TODOS')
  const [groupBy, setGroupBy] = useState<'NENHUM' | 'CURSO' | 'TIPO'>('NENHUM')

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'Nunca'
    return new Date(dataStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const cursos = useMemo(() => {
    const set = new Set(usuarios.map(u => u.curso_nome).filter(Boolean))
    return Array.from(set).sort()
  }, [usuarios])

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const nomeMatch = u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      const cargoMatch = roleFilter === 'TODOS' || (roleFilter === 'STAFF' ? u.is_staff : !u.is_staff)
      const cursoMatch = selectedCurso === 'TODOS' || u.curso_nome === selectedCurso
      return nomeMatch && cargoMatch && cursoMatch
    })
  }, [usuarios, searchTerm, roleFilter, selectedCurso])

  const grupos = useMemo(() => {
    const map: Record<string, UsuarioAdminDet[]> = {}
    if (groupBy === 'NENHUM') {
      map['Todos'] = usuariosFiltrados
    } else {
      usuariosFiltrados.forEach(u => {
        const chave = groupBy === 'CURSO' 
          ? u.curso_nome 
          : (u.is_staff ? 'Administradores' : 'Alunos')
        if (!map[chave]) map[chave] = []
        map[chave].push(u)
      })
    }
    return map
  }, [usuariosFiltrados, groupBy])

  return (
    <div className="space-y-4">
      <FiltroUsuariosAdmin
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        cursos={cursos}
        selectedCurso={selectedCurso}
        onCursoChange={setSelectedCurso}
      />
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-4 w-10"></th>
                <th className="p-4">Nome Completo / Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Curso</th>
                <th className="p-4 text-center">Matérias</th>
                <th className="p-4">Data de Cadastro</th>
                <th className="p-4">Último Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.keys(grupos).length === 0 || usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-medium">
                    Nenhum usuário correspondente aos filtros.
                  </td>
                </tr>
              ) : (
                Object.entries(grupos).map(([nomeGrupo, listaGrupo]) => (
                  <React.Fragment key={nomeGrupo}>
                    {groupBy !== 'NENHUM' && (
                      <tr className="bg-muted/30 border-b border-border select-none">
                        <td colSpan={7} className="p-3 font-extrabold text-foreground text-[10px] uppercase tracking-wider">
                          {nomeGrupo} ({listaGrupo.length})
                        </td>
                      </tr>
                    )}
                    {listaGrupo.map((u) => {
                      const expandido = u.id === expandedUserId
                      return (
                        <React.Fragment key={u.id}>
                          <tr
                            onClick={() => setExpandedUserId(expandido ? null : u.id)}
                            className="hover:bg-muted/20 transition-colors cursor-pointer select-none"
                          >
                            <td className="p-4 text-center">
                              {expandido ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                                <span>{u.nome_completo}</span>
                                {u.is_staff && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider">
                                    Staff
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">@{u.username}</div>
                            </td>
                            <td className="p-4 text-muted-foreground">{u.email}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full bg-muted font-medium text-foreground text-[10px]">
                                {u.curso_nome}
                              </span>
                            </td>
                            <td className="p-4 text-center font-semibold text-foreground">{u.total_materias}</td>
                            <td className="p-4 text-muted-foreground">{formatarData(u.date_joined)}</td>
                            <td className="p-4 text-muted-foreground">{formatarData(u.last_login)}</td>
                          </tr>
                          {expandido && (
                            <tr className="bg-muted/10">
                              <td colSpan={7} className="p-6 border-b border-border animate-in fade-in duration-200">
                                <DetalheUsuarioAdmin user={u} onToggleStaff={() => onUsuarioAlterado?.()} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

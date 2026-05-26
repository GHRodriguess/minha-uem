'use client'

import { useState } from 'react'
import { UsuarioAdminDet } from '@/lib/api/suporte'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TabelaUsuariosAdminProps {
  usuarios: UsuarioAdminDet[]
}

export default function TabelaUsuariosAdmin({ usuarios }: TabelaUsuariosAdminProps) {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'Nunca'
    return new Date(dataStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20 shrink-0">
        <h2 className="font-bold text-sm text-foreground">Usuários Ativos ({usuarios.length})</h2>
      </div>
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
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum usuário cadastrado.</td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const expandido = u.id === expandedUserId
                return (
                  <React.Fragment key={u.id}>
                    <tr
                      onClick={() => setExpandedUserId(expandido ? null : u.id)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer select-none"
                    >
                      <td className="p-4 text-center">
                        {expandido ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-foreground">{u.nome_completo}</div>
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
                          <div className="space-y-3">
                            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Matérias Cursadas pelo Aluno</h4>
                            {u.materias.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Nenhuma matéria registrada para este estudante no ano letivo corrente.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {u.materias.map((m, index) => (
                                  <div key={index} className="p-3 rounded-xl border border-border bg-card flex flex-col gap-1 transition-all duration-200 hover:border-primary/30">
                                    <span className="font-mono text-[10px] font-bold text-primary">{m.codigo}</span>
                                    <span className="font-semibold text-xs text-foreground line-clamp-1">{m.nome}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React from 'react'

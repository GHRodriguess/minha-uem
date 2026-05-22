'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useClassroom } from '../providers/ProvedorClassroom'
import SinoNotificacoes from '../atoms/SinoNotificacoes'
import { BellOff, BookOpen, AlertCircle, FileText, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { classroom_service } from '@/lib/api/classroom'
import { useAcademico } from '../providers/ProvedorAcademico'

function formatarTempoRelativo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora mesmo'
  if (diffMins < 60) return `Há ${diffMins} min`
  if (diffHours < 24) return `Há ${diffHours} h`
  if (diffDays === 1) return 'Ontem'
  return `Há ${diffDays} dias`
}

export default function DropdownNotificacoes() {
  const { data: session } = useSession()
  const { anoAtivoId } = useAcademico()
  const { unreadNotifications, notificationsCount, marcarMateriaLidaLocal } = useClassroom()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function cliqueForaDropdown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', cliqueForaDropdown)
    return () => {
      document.removeEventListener('mousedown', cliqueForaDropdown)
    }
  }, [])

  const marcarTodasComoLidas = async () => {
    if (!session?.accessToken || !unreadNotifications || unreadNotifications.total_nao_lidos === 0) return

    try {
      const promises = unreadNotifications.atualizacoes.map(upd => 
        classroom_service.marcarMuralLido(session.accessToken!, upd.materia_id, anoAtivoId || 0)
      )
      await Promise.all(promises)
      
      unreadNotifications.atualizacoes.forEach(upd => {
        marcarMateriaLidaLocal(upd.materia_id)
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <SinoNotificacoes count={notificationsCount} onClick={() => setIsOpen(!isOpen)} />

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-foreground uppercase tracking-wider">Avisos e Trabalhos</span>
              {notificationsCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                  {notificationsCount} novo{notificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {notificationsCount > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar tudo lido
              </button>
            )}
          </div>

          <div className="max-h-90 overflow-y-auto divide-y divide-border">
            {notificationsCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none">
                <div className="bg-primary/5 p-4 rounded-full mb-4 text-primary opacity-60">
                  <BellOff className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">Tudo limpo por aqui!</h3>
                <p className="text-xs text-muted-foreground font-medium">Nenhum aviso ou tarefa não lida no momento.</p>
              </div>
            ) : (
              unreadNotifications?.atualizacoes.map((atualizacao) => (
                <div key={atualizacao.materia_id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase text-primary tracking-wider truncate max-w-70">
                      {atualizacao.materia_nome}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {atualizacao.mensagens.map((msg) => (
                      <Link
                        href={`/disciplinas/${atualizacao.materia_id}`}
                        key={msg.id}
                        onClick={() => {
                          marcarMateriaLidaLocal(atualizacao.materia_id)
                          setIsOpen(false)
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${
                          msg.tipo === 'tarefa' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {msg.tipo === 'tarefa' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                            {msg.titulo}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                            {msg.tipo === 'tarefa' ? 'Tarefa' : 'Aviso no Mural'} • {formatarTempoRelativo(msg.data_criacao)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-4 bg-muted/30 text-center border-t border-border rounded-b-3xl">
            <Link
              href="/disciplinas"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground font-bold hover:text-primary transition-colors uppercase tracking-wider text-[10px]"
            >
              Ver todas as disciplinas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

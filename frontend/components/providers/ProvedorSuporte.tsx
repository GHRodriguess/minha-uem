'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { suporte_servico, UsuarioMe, ChamadoSuporte } from '@/lib/api/suporte'

interface ContextoSuporteData {
  usuarioMe: UsuarioMe | null
  carregandoMe: boolean
  chamados: ChamadoSuporte[]
  carregandoChamados: boolean
  atualizarChamados: (adminMode?: boolean) => Promise<void>
  marcarComoLidoLocal: (id: number, adminMode?: boolean) => void
  atualizarStatusLocal: (id: number, status: 'ABERTO' | 'RESOLVIDO') => void
  adicionarMensagemLocal: (ticketId: number, message: any, adminMode?: boolean) => void
  adicionarChamadoLocal: (ticket: ChamadoSuporte) => void
  notificacoesUsuario: number
  notificacoesAdmin: number
}

const ContextoSuporte = createContext<ContextoSuporteData>({} as ContextoSuporteData)

export function ProvedorSuporte({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [usuarioMe, setUsuarioMe] = useState<UsuarioMe | null>(null)
  const [carregandoMe, setCarregandoMe] = useState(true)
  const [chamados, setChamados] = useState<ChamadoSuporte[]>([])
  const [carregandoChamados, setCarregandoChamados] = useState(false)

  const carregarPerfilMe = useCallback(async () => {
    if (!session?.accessToken) {
      setCarregandoMe(false)
      return
    }
    try {
      const perfil = await suporte_servico.obterUsuarioMe(session.accessToken)
      setUsuarioMe(perfil)
    } catch (error) {
      console.error('Erro ao carregar perfil do usuario:', error)
    } finally {
      setCarregandoMe(false)
    }
  }, [session?.accessToken])

  const atualizarChamados = useCallback(async (adminMode = false) => {
    if (!session?.accessToken) return
    setCarregandoChamados(true)
    try {
      const lista = await suporte_servico.listarChamados(session.accessToken, adminMode)
      setChamados(lista)
    } catch (error) {
      console.error('Erro ao listar chamados:', error)
    } finally {
      setCarregandoChamados(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    carregarPerfilMe()
  }, [carregarPerfilMe])

  useEffect(() => {
    if (session?.accessToken && usuarioMe) {
      atualizarChamados(usuarioMe.is_staff)
    }
  }, [session?.accessToken, usuarioMe, atualizarChamados])

  const marcarComoLidoLocal = useCallback((id: number, adminMode = false) => {
    setChamados(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          read_by_user: adminMode ? c.read_by_user : true,
          read_by_admin: adminMode ? true : c.read_by_admin
        }
      }
      return c
    }))
  }, [])

  const atualizarStatusLocal = useCallback((id: number, status: 'ABERTO' | 'RESOLVIDO') => {
    setChamados(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status
        }
      }
      return c
    }))
  }, [])

  const adicionarMensagemLocal = useCallback((ticketId: number, message: any, adminMode = false) => {
    setChamados(prev => prev.map(c => {
      if (c.id === ticketId) {
        const mensagensAtuais = c.mensagens || []
        const existe = mensagensAtuais.some(m => m.id === message.id)
        const novasMensagens = existe ? mensagensAtuais : [...mensagensAtuais, message]
        return {
          ...c,
          read_by_user: adminMode ? false : true,
          read_by_admin: adminMode ? true : false,
          updated_at: new Date().toISOString(),
          mensagens: novasMensagens
        }
      }
      return c
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
  }, [])

  const adicionarChamadoLocal = useCallback((ticket: ChamadoSuporte) => {
    setChamados(prev => [ticket, ...prev])
  }, [])

  const notificacoesUsuario = chamados.filter(c => !c.read_by_user).length
  const notificacoesAdmin = chamados.filter(c => !c.read_by_admin && c.status === 'ABERTO').length

  return (
    <ContextoSuporte.Provider value={{
      usuarioMe,
      carregandoMe,
      chamados,
      carregandoChamados,
      atualizarChamados,
      marcarComoLidoLocal,
      atualizarStatusLocal,
      adicionarMensagemLocal,
      adicionarChamadoLocal,
      notificacoesUsuario,
      notificacoesAdmin
    }}>
      {children}
    </ContextoSuporte.Provider>
  )
}

export function useSuporte() {
  return useContext(ContextoSuporte)
}

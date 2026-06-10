import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ia_service, GrupoConversas, Conversa } from '@/lib/api/ia'

export function useConversasIA(isOpen: boolean, materiaId?: number) {
  const { data: session } = useSession()
  const [conversas, setConversas] = useState<GrupoConversas>({ geral: [], disciplinas: [] })
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null)
  const [modelName, setModelName] = useState('gemini-3.5-flash')
  const [loading, setLoading] = useState(false)

  const carregarConversas = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      const res = await ia_service.listarConversas(session.accessToken)
      setConversas(res)
    } catch (e) {
      console.error(e)
    }
  }, [session?.accessToken])

  useEffect(() => {
    if (isOpen) carregarConversas()
  }, [isOpen, carregarConversas])

  useEffect(() => {
    if (session?.accessToken && isOpen) {
      ia_service.obterConfig(session.accessToken)
        .then(res => {
          if (res.model_name) setModelName(res.model_name)
        })
        .catch(console.error)
    }
  }, [session, isOpen])

  const criarNovaConversa = async (mensagemInicial?: any) => {
    if (!session?.accessToken) return null
    setLoading(true)
    try {
      const msgStr = typeof mensagemInicial === 'string' ? mensagemInicial : ''
      const title = msgStr
        ? msgStr.slice(0, 30) + (msgStr.length > 30 ? '...' : '')
        : 'Nova conversa'
      const nova = await ia_service.criarConversa(session.accessToken, title, materiaId)
      await carregarConversas()
      setConversaAtiva(nova)
      return nova
    } catch (e) {
      console.error(e)
      return null
    } finally {
      setLoading(false)
    }
  }

  const excluirConversa = async (id: number) => {
    if (!session?.accessToken) return
    try {
      await ia_service.excluirConversa(id, session.accessToken)
      if (conversaAtiva?.id === id) {
        setConversaAtiva(null)
      }
      await carregarConversas()
    } catch (e) {
      console.error(e)
    }
  }

  const alterarModelo = async (modelo: string) => {
    if (!session?.accessToken) return
    try {
      await ia_service.salvarConfig(session.accessToken, undefined, modelo)
      setModelName(modelo)
    } catch (e) {
      console.error(e)
    }
  }

  return {
    conversas,
    conversaAtiva,
    setConversaAtiva,
    criarNovaConversa,
    excluirConversa,
    modelName,
    alterarModelo,
    loading,
    carregarConversas
  }
}

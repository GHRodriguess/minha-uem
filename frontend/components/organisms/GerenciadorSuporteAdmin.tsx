'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSuporte } from '@/components/providers/ProvedorSuporte'
import { suporte_servico, ChamadoSuporte } from '@/lib/api/suporte'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ListaChamados from '@/components/organisms/ListaChamados'
import ChatSuporte from '@/components/organisms/ChatSuporte'

export default function GerenciadorSuporteAdmin() {
  const { data: session } = useSession()
  const { chamados, marcarComoLidoLocal, adicionarMensagemLocal, atualizarStatusLocal } = useSuporte()
  const [chamadoSelecionado, setChamadoSelecionado] = useState<ChamadoSuporte | null>(null)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const handleSelecionarChamado = async (id: number) => {
    if (!session?.accessToken) return
    try {
      const detalhes = await suporte_servico.obterDetalhesChamado(session.accessToken, id, true)
      setChamadoSelecionado(detalhes)
      marcarComoLidoLocal(id, true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleEnviarMensagem = async (messageContent: string) => {
    if (!session?.accessToken || !chamadoSelecionado) return
    const msg = await suporte_servico.enviarMensagemChamado(session.accessToken, chamadoSelecionado.id, messageContent, true)
    adicionarMensagemLocal(chamadoSelecionado.id, msg, true)
    setChamadoSelecionado(prev => prev ? {
      ...prev,
      mensagens: [...(prev.mensagens || []), msg]
    } : null)
  }

  const handleResolverChamado = async () => {
    if (!session?.accessToken || !chamadoSelecionado) return
    try {
      await suporte_servico.atualizarStatusChamado(session.accessToken, chamadoSelecionado.id, 'RESOLVIDO')
      atualizarStatusLocal(chamadoSelecionado.id, 'RESOLVIDO')
      setChamadoSelecionado(prev => prev ? { ...prev, status: 'RESOLVIDO' } : null)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const token = session?.accessToken
    const activeId = chamadoSelecionado?.id
    if (!token || !activeId) return
    const buscarMensagensRecentes = async () => {
      try {
        const detalhes = await suporte_servico.obterDetalhesChamado(token, activeId, true)
        setChamadoSelecionado(detalhes)
      } catch {
      }
    }
    const interval = setInterval(buscarMensagensRecentes, 8000)
    return () => clearInterval(interval)
  }, [session?.accessToken, chamadoSelecionado?.id])

  const chamadosOrdenados = [...chamados].sort((a, b) => {
    if (a.status === 'ABERTO' && b.status !== 'ABERTO') return -1
    if (a.status !== 'ABERTO' && b.status === 'ABERTO') return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  const itensPorPagina = 5
  const totalPaginas = Math.ceil(chamadosOrdenados.length / itensPorPagina)
  const chamadosPaginados = chamadosOrdenados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={chamadoSelecionado ? "hidden md:block md:col-span-1" : "col-span-1"}>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h2 className="font-bold text-sm text-foreground">Todos os Chamados</h2>
          <ListaChamados chamados={chamadosPaginados} chamadoSelecionadoId={chamadoSelecionado?.id || null} onSelecionarChamado={handleSelecionarChamado} />
          {totalPaginas > 1 && (
            <div className="flex justify-between items-center pt-3 border-t border-border select-none text-[10px]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(prev => prev - 1)}
                className="rounded-xl px-2.5 h-7 font-bold text-[10px]"
              >
                Anterior
              </Button>
              <span className="font-extrabold text-muted-foreground">
                Pág. {paginaAtual} de {totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual(prev => prev + 1)}
                className="rounded-xl px-2.5 h-7 font-bold text-[10px]"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={!chamadoSelecionado ? "hidden md:block md:col-span-2" : "col-span-1 md:col-span-2"}>
        {chamadoSelecionado && (
          <Button variant="ghost" onClick={() => setChamadoSelecionado(null)} className="md:hidden mb-4 rounded-xl flex items-center gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
        )}

        {chamadoSelecionado ? (
          <ChatSuporte chamado={chamadoSelecionado} usuarioEmail={session?.user?.email || ''} onEnviarMensagem={handleEnviarMensagem} onResolverChamado={handleResolverChamado} adminMode />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center h-[calc(100vh-280px)] text-muted-foreground gap-3">
            <p className="text-sm font-semibold">Selecione um chamado da lista para ver o histórico e responder.</p>
          </div>
        )}
      </div>
    </div>
  )
}

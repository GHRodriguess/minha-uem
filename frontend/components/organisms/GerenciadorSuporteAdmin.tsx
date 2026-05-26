'use client'

import { useState } from 'react'
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

  const handleSelecionarChamado = async (id: number) => {
    if (!session?.accessToken) return
    try {
      const detalhes = await suporte_servico.obterDetalhesChamado(session.accessToken, id, true)
      setChamadoSelecionado(detalhes)
      marcarComoLidoLocal(id, true)
    } catch (err) {
      console.error('Erro ao carregar detalhes do chamado no admin:', err)
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
      console.error('Erro ao resolver chamado:', err)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={chamadoSelecionado ? "hidden md:block md:col-span-1" : "col-span-1"}>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h2 className="font-bold text-sm text-foreground">Todos os Chamados</h2>
          <ListaChamados chamados={chamados} chamadoSelecionadoId={chamadoSelecionado?.id || null} onSelecionarChamado={handleSelecionarChamado} />
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

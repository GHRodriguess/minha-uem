'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSuporte } from '@/components/providers/ProvedorSuporte'
import { suporte_servico, ChamadoSuporte } from '@/lib/api/suporte'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import ListaChamados from '@/components/organisms/ListaChamados'
import FormularioNovoChamado from '@/components/organisms/FormularioNovoChamado'
import ChatSuporte from '@/components/organisms/ChatSuporte'

export default function SuportePage() {
  const { data: session } = useSession()
  const { 
    chamados, 
    carregandoChamados, 
    marcarComoLidoLocal, 
    adicionarMensagemLocal, 
    adicionarChamadoLocal 
  } = useSuporte()
  const [chamadoSelecionado, setChamadoSelecionado] = useState<ChamadoSuporte | null>(null)
  const [exibirFormulario, setExibirFormulario] = useState(false)

  const myTickets = chamados.filter(c => c.user_email === session?.user?.email)

  const handleSelecionarChamado = async (id: number) => {
    if (!session?.accessToken) return
    setExibirFormulario(false)
    try {
      const detalhes = await suporte_servico.obterDetalhesChamado(session.accessToken, id, false)
      setChamadoSelecionado(detalhes)
      marcarComoLidoLocal(id, false)
    } catch (err) {
      console.error('Erro ao carregar detalhes do chamado:', err)
    }
  }

  const handleCriarChamado = async (title: string, category: string, message: string) => {
    if (!session?.accessToken) return
    const novo = await suporte_servico.criarChamado(session.accessToken, title, category, message)
    adicionarChamadoLocal(novo)
    setExibirFormulario(false)
    setChamadoSelecionado(novo)
  }

  const handleEnviarMensagem = async (messageContent: string) => {
    if (!session?.accessToken || !chamadoSelecionado) return
    const msg = await suporte_servico.enviarMensagemChamado(session.accessToken, chamadoSelecionado.id, messageContent, false)
    adicionarMensagemLocal(chamadoSelecionado.id, msg, false)
    setChamadoSelecionado(prev => prev ? {
      ...prev,
      mensagens: [...(prev.mensagens || []), msg]
    } : null)
  }

  useEffect(() => {
    const token = session?.accessToken
    const activeId = chamadoSelecionado?.id
    if (!token || !activeId) return
    const buscarMensagensRecentes = async () => {
      try {
        const detalhes = await suporte_servico.obterDetalhesChamado(token, activeId, false)
        setChamadoSelecionado(detalhes)
      } catch {
      }
    }
    const interval = setInterval(buscarMensagensRecentes, 8000)
    return () => clearInterval(interval)
  }, [session?.accessToken, chamadoSelecionado?.id])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Suporte ao Aluno</h1>
          <p className="text-sm text-muted-foreground">Reporte bugs, tire dúvidas e converse com a administração.</p>
        </div>
        <Button onClick={() => { setExibirFormulario(true); setChamadoSelecionado(null); }} className="rounded-xl flex items-center gap-1.5 bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" />
          <span>Novo Chamado</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={chamadoSelecionado || exibirFormulario ? "hidden md:block md:col-span-1" : "col-span-1"}>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <h2 className="font-bold text-sm text-foreground">Meus Chamados</h2>
            <ListaChamados 
              chamados={myTickets} 
              chamadoSelecionadoId={chamadoSelecionado?.id || null} 
              onSelecionarChamado={handleSelecionarChamado} 
              carregando={carregandoChamados}
            />
          </div>
        </div>

        <div className={!chamadoSelecionado && !exibirFormulario ? "hidden md:block md:col-span-2" : "col-span-1 md:col-span-2"}>
          {(chamadoSelecionado || exibirFormulario) && (
            <Button variant="ghost" onClick={() => { setChamadoSelecionado(null); setExibirFormulario(false); }} className="md:hidden mb-4 rounded-xl flex items-center gap-1 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
          )}

          {exibirFormulario ? (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-black text-lg text-foreground">Descreva seu Problema</h2>
              <FormularioNovoChamado onCriarChamado={handleCriarChamado} onCancelar={() => setExibirFormulario(false)} />
            </div>
          ) : chamadoSelecionado ? (
            <ChatSuporte chamado={chamadoSelecionado} usuarioEmail={session?.user?.email || ''} onEnviarMensagem={handleEnviarMensagem} />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center h-[calc(100vh-280px)] text-muted-foreground gap-3">
              <p className="text-sm font-semibold">Selecione um chamado da lista ou abra um novo para iniciar a conversa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

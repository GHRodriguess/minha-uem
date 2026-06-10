'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useConversasIA } from '@/lib/hooks/useConversasIA'
import { useChatIA } from '@/lib/hooks/useChatIA'
import SidebarIA from '@/components/organisms/SidebarIA'
import ChatPanelIA from '@/components/organisms/ChatPanelIA'
import FeedbackIADesativada from '@/components/molecules/FeedbackIADesativada'
import { Loader2 } from 'lucide-react'

export default function IAPage() {
  const { data: session } = useSession()
  const [sidebarAberto, setSidebarAberto] = useState(false)

  const {
    conversas,
    conversaAtiva,
    setConversaAtiva,
    criarNovaConversa,
    excluirConversa,
    modelName,
    alterarModelo,
    loading
  } = useConversasIA(true)

  const {
    messages,
    input,
    setInput,
    sending,
    hasKey,
    loadingKey,
    chatEndRef,
    enviarMensagem,
    localUploads,
    adicionarUploadLocal,
    removerUploadLocal
  } = useChatIA(true, undefined, conversaAtiva, criarNovaConversa)

  useEffect(() => {
    if (!conversaAtiva) {
      setSidebarAberto(true)
    }
  }, [conversaAtiva])

  if (loadingKey) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground z-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex bg-background text-foreground z-50 overflow-hidden font-sans">
      <SidebarIA
        conversas={conversas}
        conversaAtiva={conversaAtiva}
        onSelecionar={(c) => {
          setConversaAtiva(c)
          setSidebarAberto(false)
        }}
        onExcluir={excluirConversa}
        onCriar={async () => {
          const nova = await criarNovaConversa()
          if (nova) setSidebarAberto(false)
        }}
        loading={loading}
        userName={session?.user?.name}
        sidebarAberto={sidebarAberto}
        onCloseSidebar={() => setSidebarAberto(false)}
      />

      {sidebarAberto && (
        <div
          onClick={() => setSidebarAberto(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden animate-in fade-in duration-200"
        />
      )}

      {!hasKey ? (
        <div className="flex-1 flex items-center justify-center bg-background">
          <FeedbackIADesativada />
        </div>
      ) : (
        <ChatPanelIA
          conversaAtiva={conversaAtiva}
          messages={messages}
          input={input}
          setInput={setInput}
          sending={sending}
          enviarMensagem={enviarMensagem}
          modelName={modelName}
          onChangeModel={alterarModelo}
          chatEndRef={chatEndRef}
          localUploads={localUploads}
          adicionarUploadLocal={adicionarUploadLocal}
          removerUploadLocal={removerUploadLocal}
          onToggleSidebar={() => setSidebarAberto(!sidebarAberto)}
        />
      )}
    </div>
  )
}

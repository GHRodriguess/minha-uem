'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { academic_service } from '@/lib/api/academico'
import { 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CardSincronizacaoAgenda() {
  const { data: session } = useSession()
  const [feedUrl, setFeedUrl] = useState('')
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [selectedCalendarTab, setSelectedCalendarTab] = useState('google')

  const carregarLinkAgenda = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      const data = await academic_service.obterLinkAgenda(session.accessToken)
      setFeedUrl(data.feed_url)
    } catch (error) {
      console.error(error)
    } finally {
      setCalendarLoading(false)
    }
  }, [session])

  useEffect(() => {
    carregarLinkAgenda()
  }, [carregarLinkAgenda])

  const copiarLink = () => {
    if (!feedUrl) return
    navigator.clipboard.writeText(feedUrl)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const redefinirLink = async () => {
    if (!session?.accessToken) return
    setCalendarLoading(true)
    try {
      const data = await academic_service.regenerarLinkAgenda(session.accessToken)
      setFeedUrl(data.feed_url)
      setShowRegenerateModal(false)
    } catch (error) {
      console.error(error)
    } finally {
      setCalendarLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Sincronização de Agenda</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sincronize suas aulas, provas e trabalhos com calendários externos</p>
        </div>
      </div>

      <div className="space-y-6">
        {calendarLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Link de Sincronização Seguro (.ics)</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 h-12 px-4 rounded-xl bg-muted/30 border border-border flex items-center text-sm font-mono text-foreground overflow-x-auto whitespace-nowrap select-all scrollbar-none">
                  {feedUrl}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={copiarLink}
                    className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs gap-2 flex-1 sm:flex-none"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowRegenerateModal(true)}
                    variant="outline"
                    className="h-12 w-12 rounded-xl p-0 border-dashed shrink-0"
                    title="Redefinir Token de Segurança"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                Este link contém um token de segurança privado. Não compartilhe com ninguém. Se o link for exposto, clique no botão de atualizar ao lado para gerar um novo e invalidar o anterior.
              </p>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden bg-muted/10">
              <div className="flex border-b border-border bg-muted/20">
                {[
                  { id: 'google', label: 'Google Agenda' },
                  { id: 'apple', label: 'Apple Calendar' },
                  { id: 'notion', label: 'Notion Calendar' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCalendarTab(tab.id)}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      selectedCalendarTab === tab.id
                        ? 'border-primary text-primary bg-background/50'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4">
                {selectedCalendarTab === 'google' && (
                  <ol className="list-decimal list-inside space-y-3 text-xs text-muted-foreground font-semibold leading-relaxed">
                    <li>Acesse o <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google Agenda</a> no computador.</li>
                    <li>No painel lateral esquerdo, clique no botão <span className="font-bold text-foreground">+</span> ao lado de <span className="font-bold text-foreground">"Outras agendas"</span> e selecione <span className="font-bold text-foreground">"Do URL"</span>.</li>
                    <li>Cole o link copiado no campo indicado e clique em <span className="font-bold text-foreground">"Adicionar agenda"</span>.</li>
                    <li>O Google sincronizará automaticamente todas as suas aulas, provas e trabalhos no calendário!</li>
                  </ol>
                )}

                {selectedCalendarTab === 'apple' && (
                  <ol className="list-decimal list-inside space-y-3 text-xs text-muted-foreground font-semibold leading-relaxed">
                    <li>Abra o aplicativo <span className="font-bold text-foreground">Calendário</span> no seu Mac, iPhone ou iPad.</li>
                    <li>No Mac: Vá em <span className="font-bold text-foreground">Arquivo &gt; Nova Assinatura de Calendário</span>, cole o link e clique em Inscrever-se.</li>
                    <li>No iOS (iPhone/iPad): Acesse Ajustes &gt; Calendário &gt; Contas &gt; Adicionar Conta &gt; Outra &gt; Adicionar Assinatura de Calendário, cole o link e salve.</li>
                    <li>Defina o intervalo de atualização automática desejado para manter as datas sempre sincronizadas.</li>
                  </ol>
                )}

                {selectedCalendarTab === 'notion' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      O Notion Calendar gerencia seus horários importando dados diretamente das suas contas do Google Calendar.
                    </p>
                    <ol className="list-decimal list-inside space-y-3 text-xs text-muted-foreground font-semibold leading-relaxed">
                      <li>Siga as instruções descritas na aba <span className="font-bold text-foreground">"Google Agenda"</span> para adicionar o feed à sua conta institucional do Google Workspace (<span className="font-bold text-primary">@uem.br</span>).</li>
                      <li>Abra o Notion Calendar e certifique-se de que a conta Google correspondente está vinculada nas configurações de contas do aplicativo.</li>
                      <li>Ative a exibição do calendário <span className="font-bold text-foreground">"Minha UEM"</span> no painel esquerdo do Notion Calendar para ver todas as suas atividades e prazos integrados!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showRegenerateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Redefinir link de agenda?</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                  Ao redefinir o link, o endereço anterior será desativado permanentemente. Você precisará atualizar a URL de assinatura em todos os seus aplicativos de agenda (Google, Apple, Notion) com o novo link.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={redefinirLink}
                className="bg-amber-500 hover:bg-amber-600 text-white h-11 px-4 rounded-xl font-bold text-xs flex-1"
              >
                Confirmar e Redefinir
              </Button>
              <Button
                onClick={() => setShowRegenerateModal(false)}
                variant="outline"
                className="h-11 px-4 rounded-xl font-bold text-xs flex-1 border-dashed"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

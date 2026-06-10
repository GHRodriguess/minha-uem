import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useAcademico } from '@/components/providers/ProvedorAcademico'
import { ia_service } from '@/lib/api/ia'
import { obterArquivosBase64 } from '@/lib/utils/leitorArquivoIA'
import { useCarregarDadosIA } from '@/lib/hooks/useCarregarDadosIA'
import { obterMensagemErroIA } from '@/lib/utils/formatadorErroIA'

export interface Mensagem { text: string; isUser: boolean }

const emptyCallback = () => {}

export function useChatIA(
  isOpen: boolean,
  fileUrls?: Record<string, string>,
  conversaAtiva?: any,
  criarNovaConversa?: (msg?: string) => Promise<any>
) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { filesCache, obterArquivos, directoryHandle, hasFolderPermission } = useClassroom()
  const { anoAtivoId } = useAcademico()
  const [messages, setMessages] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const carregadaIdRef = useRef<number | null>(null)

  const materiaId = pathname?.includes('/disciplinas/') ? Number(pathname.split('/disciplinas/')[1]?.split('/')[0]) : undefined
  const arquivoAbertoIds = [searchParams.get('fileId'), searchParams.get('rightFileId')].filter(Boolean) as string[]

  useCarregarDadosIA(session, isOpen, materiaId, anoAtivoId, filesCache, obterArquivos, setHasKey, emptyCallback)

  useEffect(() => {
    if (session?.accessToken && conversaAtiva?.id) {
      if (conversaAtiva.id === carregadaIdRef.current) return
      carregadaIdRef.current = conversaAtiva.id
      if (sending) return
      ia_service.obterMensagensConversa(conversaAtiva.id, session.accessToken)
        .then(res => setMessages(res.messages.map(m => ({ text: m.text, isUser: m.role === 'user' }))))
        .catch(console.error)
    } else {
      if (!sending) setMessages([])
      carregadaIdRef.current = null
    }
  }, [conversaAtiva, session?.accessToken, sending])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const alternarArquivo = (id: string) => setSelectedFileIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session?.accessToken || sending) return
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { text: userMsg, isUser: true }, { text: '', isUser: false }])
    setSending(true)
    try {
      let activeConversa = conversaAtiva
      if (!activeConversa && criarNovaConversa) activeConversa = await criarNovaConversa(userMsg)
      if (!activeConversa) throw new Error('Não foi possível criar uma nova conversa.')
      const activeFileIds = Array.from(new Set([...arquivoAbertoIds, ...selectedFileIds]))
      const localFilesData = await obterArquivosBase64(
        activeFileIds, fileUrls, arquivosMateria, directoryHandle, hasFolderPermission, session.googleAccessToken || null
      )
      await ia_service.enviarMensagemConversa(
        session.accessToken, session.googleAccessToken || null, activeConversa.id, userMsg,
        arquivoAbertoIds.join(',') || undefined, selectedFileIds,
        (chunk) => {
          setMessages(prev => {
            const list = [...prev]
            const last = list[list.length - 1]
            if (last && !last.isUser) list[list.length - 1] = { ...last, text: last.text + chunk }
            return list
          })
        },
        undefined,
        localFilesData
      )
    } catch (err: any) {
      setMessages(prev => [...prev.slice(0, -1), { text: obterMensagemErroIA(err), isUser: false }])
    } finally {
      setSending(false)
    }
  }

  const arquivosMateria = (materiaId ? filesCache[materiaId] : null)?.arquivos || []
  const arquivosAbertos = arquivosMateria.filter(f => arquivoAbertoIds.includes(f.drive_file_id))

  return {
    messages, input, setInput, sending, hasKey,
    selectedFileIds, chatEndRef, materiaId, arquivosMateria,
    arquivosAbertos, alternarArquivo, enviarMensagem
  }
}

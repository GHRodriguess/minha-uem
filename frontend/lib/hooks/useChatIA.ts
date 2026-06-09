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

export function useChatIA(isOpen: boolean, fileUrls?: Record<string, string>) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { filesCache, obterArquivos, directoryHandle, hasFolderPermission } = useClassroom()
  const { anoAtivoId } = useAcademico()
  const [messages, setMessages] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [modelName, setModelName] = useState('gemini-3.5-flash')
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  const materiaId = pathname?.includes('/disciplinas/') ? Number(pathname.split('/disciplinas/')[1]?.split('/')[0]) : undefined
  const arquivoAbertoIds = [searchParams.get('fileId'), searchParams.get('rightFileId')].filter(Boolean) as string[]

  useCarregarDadosIA(session, isOpen, materiaId, anoAtivoId, filesCache, obterArquivos, setHasKey, setModelName)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const alternarArquivo = (id: string) => setSelectedFileIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const alterarModelo = (modelo: string) => {
    if (session?.accessToken) {
      ia_service.salvarConfig(session.accessToken, undefined, modelo)
        .then(() => setModelName(modelo))
        .catch(console.error)
    }
  }

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session?.accessToken || sending) return

    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { text: userMsg, isUser: true }, { text: '', isUser: false }])
    setSending(true)

    try {
      const activeFileIds = Array.from(new Set([...arquivoAbertoIds, ...selectedFileIds]))
      const localFilesData = await obterArquivosBase64(
        activeFileIds,
        fileUrls,
        arquivosMateria,
        directoryHandle,
        hasFolderPermission,
        session.googleAccessToken || null
      )

      await ia_service.enviarMensagem(
        session.accessToken,
        session.googleAccessToken || null,
        userMsg,
        materiaId,
        arquivoAbertoIds.join(',') || undefined,
        selectedFileIds,
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
      setMessages(prev => {
        const list = prev.slice(0, -1)
        return [...list, { text: obterMensagemErroIA(err), isUser: false }]
      })
    } finally {
      setSending(false)
    }
  }

  const arquivosMateria = (materiaId ? filesCache[materiaId] : null)?.arquivos || []
  const arquivosAbertos = arquivosMateria.filter(f => arquivoAbertoIds.includes(f.drive_file_id))

  return {
    messages, input, setInput, sending, hasKey, modelName, alterarModelo,
    selectedFileIds, chatEndRef, materiaId, arquivosMateria,
    arquivosAbertos, alternarArquivo, enviarMensagem
  }
}

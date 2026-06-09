import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ia_service, EstatisticaUsoIA } from '@/lib/api/ia'

export function useConfigIA() {
  const { data: session } = useSession()
  const [hasKey, setHasKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash')
  const [usageToday, setUsageToday] = useState<EstatisticaUsoIA[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const carregarConfiguracao = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      const data = await ia_service.obterConfig(session.accessToken)
      setHasKey(data.possui_chave)
      setSelectedModel(data.model_name || 'gemini-3.5-flash')
      setUsageToday(data.uso_hoje || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    carregarConfiguracao()
  }, [carregarConfiguracao])

  const salvarChave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken || !apiKey.trim()) return
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await ia_service.salvarConfig(session.accessToken, apiKey.trim(), selectedModel)
      setHasKey(true)
      setApiKey('')
      setSuccessMessage('Chave de API validada e salva com sucesso!')
      setTimeout(() => setSuccessMessage(''), 4000)
      carregarConfiguracao()
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao validar a chave de API.')
    } finally {
      setSaving(false)
    }
  }

  const alterarModelo = async (modelo: string) => {
    if (!session?.accessToken) return
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await ia_service.salvarConfig(session.accessToken, undefined, modelo)
      setSelectedModel(modelo)
      setSuccessMessage(`Modelo alterado para ${modelo} com sucesso!`)
      setTimeout(() => setSuccessMessage(''), 4000)
      const data = await ia_service.obterConfig(session.accessToken)
      setUsageToday(data.uso_hoje || [])
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao alterar o modelo.')
    } finally {
      setLoading(false)
    }
  }

  const removerChave = async () => {
    if (!session?.accessToken) return
    setRemoving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await ia_service.removerConfig(session.accessToken)
      setHasKey(false)
      setShowConfirmDelete(false)
      setSuccessMessage('Chave de API removida do sistema.')
      setTimeout(() => setSuccessMessage(''), 4000)
      setUsageToday([])
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao remover a chave de API.')
    } finally {
      setRemoving(false)
    }
  }

  return {
    hasKey, apiKey, setApiKey, selectedModel, usageToday, loading, saving, removing,
    errorMessage, successMessage, showConfirmDelete, setShowConfirmDelete,
    salvarChave, alterarModelo, removerChave
  }
}

'use client'

import { useState, useRef } from 'react'
import { academic_service } from '@/lib/api/academico'
import { Perfil } from '@/types/academico'
import { Upload, CheckCircle2, AlertCircle, Loader2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { useAcademico } from '../providers/ProvedorAcademico'
import Modal from '../shared/Modal'
import { Button } from '../ui/button'

interface CardUploadPDFProps {
  onSuccess: (data: Perfil) => void
  token: string
}

export default function CardUploadPDF({ onSuccess, token }: CardUploadPDFProps) {
  const { atualizarAnos, notificarMudanca } = useAcademico()
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [conflictYear, setConflictYear] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processarUpload = async (file: File, confirmed: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const response = await academic_service.enviarHorario(token, file, confirmed)
      
      if ('conflito' in response && response.conflito) {
        setPendingFile(file)
        setConflictYear(response.ano)
        setIsModalOpen(true)
        setLoading(false)
        return
      }

      const data = response as Perfil
      await atualizarAnos()
      notificarMudanca()
      onSuccess(data)
      setPendingFile(null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar o arquivo.'
      setError(errorMessage)
      setPendingFile(null)
    } finally {
      setLoading(false)
    }
  }

  const validarESolicitarUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Por favor, envie um arquivo PDF.')
      return
    }
    processarUpload(file)
  }

  const confirmarUpload = () => {
    if (pendingFile) {
      processarUpload(pendingFile, true)
    }
    setIsModalOpen(false)
  }

  const cancelarUpload = () => {
    setPendingFile(null)
    setConflictYear(null)
    setIsModalOpen(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validarESolicitarUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl w-full mx-auto shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Configure seu Horário</h2>
        <p className="text-muted-foreground mt-2">
          Ainda não detectamos suas disciplinas. Envie o PDF do seu horário da UEM para começar.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
          loading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && validarESolicitarUpload(e.target.files[0])}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="font-medium text-foreground">Processando seu horário...</p>
          </div>
        ) : (
          <>
            <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                Arraste seu PDF aqui ou clique para buscar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Apenas arquivos .pdf são aceitos
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Extração automática de curso</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Mapeamento de disciplinas</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Grade de horários completa</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Controle de faltas integrado</span>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={cancelarUpload}
        title="Confirmar Envio de Horário"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-bold text-lg">Substituir dados de {conflictYear}?</p>
            <p className="text-muted-foreground">
              Detectamos que este horário é para o ano de {conflictYear}. Você já possui dados cadastrados para este período. Deseja sobrescrevê-los?
            </p>
            {pendingFile && (
              <p className="text-sm font-medium text-primary bg-primary/5 py-1 px-3 rounded-lg inline-block">
                Arquivo: {pendingFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-3 w-full mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={cancelarUpload}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={confirmarUpload}
            >
              Confirmar e Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

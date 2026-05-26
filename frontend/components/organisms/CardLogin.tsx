'use client'

import Link from 'next/link'
import BotaoLoginGoogle from '../atoms/BotaoLoginGoogle'
import AlertaErroDominio from '../molecules/AlertaErroDominio'

interface PropriedadesCardLogin {
  error?: string | null
}

export default function CardLogin({ error }: PropriedadesCardLogin) {
  const is_access_denied = error === 'AccessDenied'
  const is_server_error = error === 'BackendError'

  return (
    <div className="p-6 sm:p-10 bg-background shadow-2xl rounded-3xl max-w-md w-full border border-border flex flex-col items-center">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Minha UEM</h1>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg">Acesso exclusivo para @uem.br</p>
      </div>
      
      {is_access_denied && (
        <AlertaErroDominio mensagem="Você deve utilizar um e-mail institucional @uem.br para acessar esta plataforma." />
      )}

      {is_server_error && (
        <AlertaErroDominio mensagem="Não foi possível estabelecer uma conexão com o servidor. Por favor, verifique se a API do backend está ativa e configurada corretamente em produção." />
      )}
      
      <div className="w-full">
        <BotaoLoginGoogle />
      </div>
      
      <div className="mt-8 pt-6 border-t border-border w-full text-center flex flex-col gap-3">
        <Link
          href="/landing"
          className="text-sm font-semibold text-primary hover:opacity-85 transition-opacity"
        >
          Conhecer as funcionalidades do Minha UEM
        </Link>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Problemas com o acesso? Contate o suporte da UEM.
          </p>
          <div className="flex justify-center items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <Link
              href="/politica-de-privacidade"
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link
              href="/termos-de-servico"
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              Termos de Serviço
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

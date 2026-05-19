'use client'

interface PropriedadesAlertaErroDominio {
  mensagem: string
}

export default function AlertaErroDominio({ mensagem }: PropriedadesAlertaErroDominio) {
  return (
    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="mt-0.5 text-destructive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-destructive">Acesso Negado</h3>
        <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
          {mensagem}
        </p>
      </div>
    </div>
  )
}

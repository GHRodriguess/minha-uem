'use client'

import Link from 'next/link'
import { GraduationCap, ArrowLeft } from 'lucide-react'

export default function SecaoCabecalhoTermos() {
  const last_updated_date = '26 de maio de 2026'

  return (
    <header className="w-full bg-card border-b border-border py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-gradient from-primary/5 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/landing" className="flex items-center gap-2 font-black text-xl text-foreground">
            <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Minha UEM</span>
          </Link>
          <Link 
            href="/landing" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
        <div className="space-y-2 pt-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Termos de Serviço
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Bem-vindo ao Minha UEM. Ao utilizar nossa plataforma, você aceita de forma tácita todas as condições de uso listadas neste termo.
          </p>
          <div className="inline-block text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full border border-border mt-2">
            Última atualização: {last_updated_date}
          </div>
        </div>
      </div>
    </header>
  )
}

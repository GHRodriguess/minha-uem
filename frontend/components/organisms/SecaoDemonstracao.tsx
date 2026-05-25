'use client'

import { useState } from 'react'
import { FileText, Loader2, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'
import RevelarScroll from '../atoms/RevelarScroll'

export default function SecaoDemonstracao() {
  const [fase, setFase] = useState<'ocioso' | 'processando' | 'concluido'>('ocioso')

  const iniciarSimulacao = () => {
    setFase('processando')
    setTimeout(() => {
      setFase('concluido')
    }, 1500)
  }

  return (
    <section className="py-20 md:py-28 px-4 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Veja a mágica acontecer
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Experimente o simulador abaixo e veja como o sistema lê e organiza o PDF oficial da UEM em menos de dois segundos.
          </p>
        </div>

        <RevelarScroll>
          <div className="bg-card border border-border p-8 rounded-3xl shadow-xl w-full flex flex-col items-center justify-center min-h-[300px]">
            {fase === 'ocioso' && (
              <div 
                onClick={iniciarSimulacao}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group"
              >
                <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-foreground text-base sm:text-lg">
                    Clique aqui para simular o upload de um horário.pdf
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Simule a extração inteligente em tempo real
                  </p>
                </div>
              </div>
            )}

            {fase === 'processando' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="text-center space-y-1">
                  <p className="font-semibold text-foreground">Analisando documento acadêmico...</p>
                  <p className="text-xs text-muted-foreground animate-pulse">Extraindo salas, horários e códigos de turmas...</p>
                </div>
              </div>
            )}

            {fase === 'concluido' && (
              <div className="w-full space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 text-green-500 justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold">Processamento concluído com sucesso!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Curso Identificado:</span>
                    <p className="font-bold text-foreground">Ciência da Computação (Integral)</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Ano Letivo Mapeado:</span>
                    <p className="font-bold text-foreground">2026</p>
                  </div>
                  <div className="space-y-1 border-t border-border/30 pt-3 sm:border-t-0 sm:pt-0">
                    <span className="text-xs text-muted-foreground">Grade e Horários:</span>
                    <p className="font-bold text-foreground">5 disciplinas integradas</p>
                  </div>
                  <div className="space-y-1 border-t border-border/30 pt-3 sm:border-t-0 sm:pt-0">
                    <span className="text-xs text-muted-foreground">Locais de Aula:</span>
                    <p className="font-bold text-foreground">Bloco C80, Bloco C79</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button 
                    onClick={() => setFase('ocioso')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Simular Novamente
                  </button>
                  <a 
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all cursor-pointer group"
                  >
                    Começar de verdade
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </RevelarScroll>
      </div>
    </section>
  )
}

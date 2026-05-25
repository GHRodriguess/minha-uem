'use client'

import { ShieldCheck, Upload, RefreshCw, Sparkles } from 'lucide-react'
import RevelarScroll from '../atoms/RevelarScroll'

export default function SecaoPassos() {
  const passosList = [
    {
      icon: ShieldCheck,
      numero: '01',
      titulo: 'Acesso Institucional',
      descricao: 'Faça login de forma rápida e segura utilizando sua conta Google Workspace @uem.br.'
    },
    {
      icon: Upload,
      numero: '02',
      titulo: 'Envio do Horário',
      descricao: 'Carregue o PDF de horários do Portal do Estudante. O sistema lê os dados em segundos.'
    },
    {
      icon: RefreshCw,
      numero: '03',
      titulo: 'Conexão Classroom',
      descricao: 'Vincule suas turmas acadêmicas às salas correspondentes do Google Classroom com um clique.'
    },
    {
      icon: Sparkles,
      numero: '04',
      titulo: 'Aproveite o Painel',
      descricao: 'Visualize salas, baixe arquivos, acompanhe prazos de tarefas e gerencie suas faltas.'
    }
  ]

  return (
    <section className="py-20 md:py-28 px-4 bg-muted/10 border-b border-border">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Como começar a usar?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Preparamos um fluxo extremamente simples para você configurar seu semestre em menos de 2 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {passosList.map((passo, index) => {
            const Icone = passo.icon
            return (
              <RevelarScroll key={index} atrasoMs={index * 100}>
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 group">
                  <div className="relative flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icone className="w-8 h-8" />
                    <span className="absolute -top-3 -right-3 text-xs font-bold bg-card border border-border px-2 py-0.5 rounded-full text-foreground shadow-sm">
                      {passo.numero}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                      {passo.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {passo.descricao}
                    </p>
                  </div>
                </div>
              </RevelarScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}

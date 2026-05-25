'use client'

import { GraduationCap, ArrowRight, LayoutDashboard, Calendar, Clock } from 'lucide-react'
import BotaoLanding from '../atoms/BotaoLanding'
import BadgeFuncionalidade from '../atoms/BadgeFuncionalidade'

export default function SecaoHero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center py-12 md:py-24 px-4 overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
          <BadgeFuncionalidade>
            <GraduationCap className="w-3.5 h-3.5" />
            Desenvolvido para alunos da UEM
          </BadgeFuncionalidade>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight leading-none">
            Seu ecossistema acadêmico, <span className="bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">simplificado.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Sincronize seus horários da UEM automaticamente via PDF, monitore suas faltas em tempo real e integre-se diretamente com o Google Classroom em uma interface incrível.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <BotaoLanding href="/login" variante="primaria" className="w-full sm:w-auto group">
              Acessar Sistema
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </BotaoLanding>
            <BotaoLanding href="#recursos" variante="outline" className="w-full sm:w-auto">
              Ver Recursos
            </BotaoLanding>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl backdrop-blur-md animate-bounce-slow">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground text-sm">Painel Acadêmico</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-foreground text-sm">Algoritmos Avançados</h4>
                  <p className="text-xs text-muted-foreground mt-1">Sala 102 • Bloco C80</p>
                </div>
                <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">UEM</span>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-foreground/80 text-sm">Estruturas de Dados</h4>
                  <p className="text-xs text-muted-foreground mt-1">Sala 201 • Bloco C79</p>
                </div>
                <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">UEM</span>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Segunda a Sexta
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Próxima aula: 07:30
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

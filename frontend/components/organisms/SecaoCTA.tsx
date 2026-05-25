'use client'

import { ArrowRight, GraduationCap } from 'lucide-react'
import BotaoLanding from '../atoms/BotaoLanding'
import RevelarScroll from '../atoms/RevelarScroll'

export default function SecaoCTA() {
  return (
    <section className="py-20 md:py-28 px-4 bg-background relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent opacity-65 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <RevelarScroll>
          <div className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-6 backdrop-blur-md">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                Pronto para otimizar seus estudos?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Junte-se a centenas de alunos da UEM que já simplificaram o gerenciamento de horários, tarefas e faltas em uma única interface inteligente.
              </p>
            </div>
            
            <div className="pt-2 w-full sm:w-auto">
              <BotaoLanding href="/login" variante="primaria" className="w-full sm:w-auto group">
                Começar Agora
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </BotaoLanding>
            </div>
          </div>
        </RevelarScroll>
      </div>
    </section>
  )
}

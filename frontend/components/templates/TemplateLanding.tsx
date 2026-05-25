'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import SecaoHero from '../organisms/SecaoHero'
import SecaoPassos from '../organisms/SecaoPassos'
import SecaoRecursos from '../organisms/SecaoRecursos'
import SecaoDemonstracao from '../organisms/SecaoDemonstracao'
import SecaoFAQ from '../organisms/SecaoFAQ'
import SecaoCTA from '../organisms/SecaoCTA'
import RodapeLanding from '../organisms/RodapeLanding'

export default function TemplateLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased scroll-smooth">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 font-black text-xl text-foreground">
            <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Minha UEM</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <a 
              href="#recursos" 
              className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </a>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-primary/20"
            >
              Acessar Painel
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <SecaoHero />
        <SecaoPassos />
        <SecaoRecursos />
        <SecaoDemonstracao />
        <SecaoFAQ />
        <SecaoCTA />
      </main>

      <RodapeLanding />
    </div>
  )
}

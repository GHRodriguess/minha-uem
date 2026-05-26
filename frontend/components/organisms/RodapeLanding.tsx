'use client'

import Link from 'next/link'

export default function RodapeLanding() {
  const current_year = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-xl font-black text-foreground">Minha UEM</h2>
          <p className="text-xs text-muted-foreground">
            Sua rotina universitária simplificada e automatizada de forma inteligente.
          </p>
        </div>
        
        <div className="flex gap-6 text-sm flex-wrap justify-center">
          <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
            Acessar Sistema
          </Link>
          <Link href="/politica-de-privacidade" className="text-muted-foreground hover:text-primary transition-colors">
            Política de Privacidade
          </Link>
          <a href="#recursos" className="text-muted-foreground hover:text-primary transition-colors">
            Funcionalidades
          </a>
          <a href="https://www.uem.br" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            Portal UEM
          </a>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/30 text-center text-xs text-muted-foreground">
        <p>© {current_year} Minha UEM. Todos os direitos reservados. Este projeto não possui vínculo oficial com a administração da UEM.</p>
      </div>
    </footer>
  )
}


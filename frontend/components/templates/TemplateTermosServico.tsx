'use client'

import SecaoCabecalhoTermos from '../organisms/SecaoCabecalhoTermos'
import SecaoConteudoTermos from '../organisms/SecaoConteudoTermos'
import RodapeLanding from '../organisms/RodapeLanding'

export default function TemplateTermosServico() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased scroll-smooth">
      <SecaoCabecalhoTermos />
      
      <main className="flex-1">
        <SecaoConteudoTermos />
      </main>

      <RodapeLanding />
    </div>
  )
}

'use client'

import SecaoCabecalhoPolitica from '../organisms/SecaoCabecalhoPolitica'
import SecaoConteudoPolitica from '../organisms/SecaoConteudoPolitica'
import RodapeLanding from '../organisms/RodapeLanding'

export default function TemplatePoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased scroll-smooth">
      <SecaoCabecalhoPolitica />
      
      <main className="flex-1">
        <SecaoConteudoPolitica />
      </main>

      <RodapeLanding />
    </div>
  )
}

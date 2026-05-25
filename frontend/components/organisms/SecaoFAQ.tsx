'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'
import RevelarScroll from '../atoms/RevelarScroll'

export default function SecaoFAQ() {
  const [itemAberto, setItemAberto] = useState<number | null>(null)

  const faqList = [
    {
      pergunta: 'O sistema é seguro? Meus dados estão protegidos?',
      resposta: 'Sim! Toda a autenticação é realizada diretamente pelo Google Auth. Seus dados acadêmicos são processados em servidores seguros e de uso estritamente pessoal para exibir suas estatísticas.'
    },
    {
      pergunta: 'Como funciona a extração dos dados do PDF?',
      resposta: 'O Minha UEM lê a estrutura textual e de tabela do PDF oficial de horários ou histórico emitido pela UEM. Ele identifica automaticamente os códigos, disciplinas, salas, blocos, horários de aula e ano letivo em segundos.'
    },
    {
      pergunta: 'Preciso enviar o PDF toda semana?',
      resposta: 'Não. Você só precisa enviar o arquivo PDF uma única vez no início do ano letivo ou semestre. As informações de disciplinas e horários ficam salvas no sistema e você pode editá-las ou atualizá-las quando desejar.'
    },
    {
      pergunta: 'A sincronização com o Classroom é automática?',
      resposta: 'Sim. Assim que você vincula uma matéria do seu horário com a turma correspondente no Google Classroom, o Minha UEM passa a exibir avisos, materiais e prazos de entregas de tarefas em tempo real.'
    }
  ]

  const alternarItem = (indice: number) => {
    setItemAberto(itemAberto === indice ? null : indice)
  }

  return (
    <section className="py-20 md:py-28 px-4 bg-muted/15 border-b border-border">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Esclareça suas principais dúvidas sobre o funcionamento do Minha UEM.
          </p>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, index) => {
            const isAberto = itemAberto === index
            return (
              <RevelarScroll key={index} atrasoMs={index * 50}>
                <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => alternarItem(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground text-sm sm:text-base hover:text-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                      <span>{faq.pergunta}</span>
                    </div>
                    <ChevronDown className={clsx("w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300", isAberto && "rotate-180")} />
                  </button>
                  
                  <div
                    className={clsx(
                      "transition-all duration-300 ease-in-out overflow-hidden",
                      isAberto ? "max-h-40 border-t border-border/50" : "max-h-0"
                    )}
                  >
                    <p className="p-5 text-sm leading-relaxed text-muted-foreground bg-muted/20">
                      {faq.resposta}
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

'use client'

import { FileText, ShieldAlert, CheckCircle, HelpCircle, RefreshCw } from 'lucide-react'

interface ItemTermo {
  id: string
  title: string
  description: string
  Icon: any
}

export default function SecaoConteudoTermos() {
  const terms_sections: ItemTermo[] = [
    {
      id: '1',
      title: '1. Aceitação e Elegibilidade',
      description: 'Ao acessar a plataforma Minha UEM, você declara ser estudante ativo da Universidade Estadual de Maringá e concorda com estes termos. O acesso é restrito e exclusivo a usuários que se autentiquem por meio de uma conta com o domínio institucional oficial @uem.br.',
      Icon: CheckCircle
    },
    {
      id: '2',
      title: '2. Natureza do Serviço e Independência',
      description: 'O Minha UEM é uma plataforma independente desenvolvida para simplificar e automatizar a visualização de horários, tarefas, notas e avisos. Declaramos explicitamente que esta iniciativa NÃO possui vínculo oficial, convênio ou patrocínio com a administração central ou órgãos de tecnologia da UEM.',
      Icon: HelpCircle
    },
    {
      id: '3',
      title: '3. Autenticação e Uso da Conta Google',
      description: 'Nossa autenticação é efetuada através do Google Auth. Solicitamos permissões específicas do Google Classroom e Google Drive para exibir seus materiais e atividades em tempo real no painel acadêmico. Nós não armazenamos suas credenciais ou senhas em nossos servidores.',
      Icon: FileText
    },
    {
      id: '4',
      title: '4. Limitação de Responsabilidade',
      description: 'Os dados exibidos pelo Minha UEM são de caráter informativo e para auxílio na organização diária. Não nos responsabilizamos por perdas de prazos, indisponibilidades das APIs do Google ou inconsistências temporárias. Notas e frequências finais oficiais devem ser confirmadas no portal acadêmico oficial da UEM.',
      Icon: ShieldAlert
    },
    {
      id: '5',
      title: '5. Alterações dos Termos e do Serviço',
      description: 'Reservamo-nos o direito de modificar estes termos de serviço ou suspender/descontinuar o funcionamento da plataforma a qualquer momento, sem necessidade de aviso prévio. O uso continuado do sistema após eventuais modificações constituirá a aceitação dos termos revisados.',
      Icon: RefreshCw
    }
  ]

  return (
    <section className="py-12 max-w-4xl mx-auto px-4 space-y-8">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Leia atentamente as diretrizes de uso do Minha UEM. Ao utilizar a nossa plataforma acadêmica de facilitação de rotina, você concorda inteiramente com as condições descritas abaixo.
        </p>
      </div>

      <div className="space-y-6">
        {terms_sections.map((section) => {
          const ComponenteIcone = section.Icon
          return (
            <div key={section.id} className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-4 items-start">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <ComponenteIcone className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {section.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

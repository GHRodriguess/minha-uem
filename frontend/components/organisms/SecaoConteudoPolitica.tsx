'use client'

import { Shield, Eye, Database, Share2, Key } from 'lucide-react'

interface ItemEscopo {
  id: string
  name: string
  purpose: string
}

export default function SecaoConteudoPolitica() {
  const google_scopes: ItemEscopo[] = [
    {
      id: '1',
      name: 'Perfil e E-mail (openid, email, profile)',
      purpose: 'Identificar você unicamente e garantir o acesso exclusivo a estudantes com e-mail institucional @uem.br.'
    },
    {
      id: '2',
      name: 'Turmas (classroom.courses.readonly)',
      purpose: 'Visualizar as turmas em que você está inscrito para organizar sua grade horária e listar suas disciplinas automaticamente.'
    },
    {
      id: '3',
      name: 'Avisos (classroom.announcements.readonly)',
      purpose: 'Exibir os comunicados oficiais e avisos das turmas diretamente na interface do seu painel acadêmico.'
    },
    {
      id: '4',
      name: 'Materiais (classroom.courseworkmaterials.readonly)',
      purpose: 'Permitir o acesso rápido aos materiais de estudo postados pelos professores no Google Classroom.'
    },
    {
      id: '5',
      name: 'Trabalhos (classroom.coursework.me.readonly)',
      purpose: 'Acompanhar prazos, pendências, tarefas e notas pessoais de cada atividade das disciplinas.'
    },
    {
      id: '6',
      name: 'Google Drive (drive.readonly)',
      purpose: 'Permitir que você visualize os arquivos de apoio e anexos vinculados às atividades e materiais das aulas.'
    }
  ]

  const limited_use_url = 'https://developers.google.com/terms/api-services-user-data-policy'

  return (
    <section className="py-12 max-w-4xl mx-auto px-4 space-y-12">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          Acesso e Uso de Dados do Google
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          O Minha UEM utiliza a autenticação do Google para integrar suas informações acadêmicas de forma transparente. Nós apenas solicitamos as permissões estritamente necessárias para o funcionamento do painel de estudante. Veja detalhadamente como cada escopo é utilizado:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {google_scopes.map((scope) => (
            <div key={scope.id} className="p-4 bg-background border border-border/60 rounded-xl space-y-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                {scope.name}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {scope.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Armazenamento e Proteção
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Nossos servidores não armazenam seus dados acadêmicos de forma definitiva. Os dados das APIs do Google são consumidos em tempo real e mantidos temporariamente em memória de forma segura. Seus tokens de acesso do Google são criptografados e salvos localmente no seu próprio navegador para autenticação das requisições.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartilhamento e Publicidade
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Temos o compromisso inabalável com a sua privacidade. Nós <b>não compartilhamos</b>, não vendemos e não transferimos qualquer informação de usuários do Google para terceiros. Seus dados nunca serão usados para fins de marketing, publicidade ou exibição de anúncios no sistema.
          </p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Declaração de Uso Limitado
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
          O uso e a transferência de informações recebidas das APIs do Google pelo Minha UEM para qualquer outro aplicativo obedecerão à{' '}
          <a
            href={limited_use_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de Uso Limitado (Limited Use).
        </p>
        <p className="text-muted-foreground text-xs sm:text-sm pt-2 border-t border-border/30">
          Você pode revogar o acesso do Minha UEM aos seus dados a qualquer momento diretamente nas configurações de segurança da sua Conta do Google.
        </p>
      </div>
    </section>
  )
}

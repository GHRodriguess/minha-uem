'use client'

import { UploadCloud, BookOpen, FolderOpen, RefreshCcw, CalendarRange, CheckSquare } from 'lucide-react'
import CardRecurso from '../molecules/CardRecurso'
import RevelarScroll from '../atoms/RevelarScroll'

export default function SecaoRecursos() {
  const recursosList = [
    {
      icon: UploadCloud,
      titulo: 'Leitura de PDF Acadêmico',
      descricao: 'Arraste o PDF oficial da UEM. O sistema mapeia instantaneamente seu curso, matérias, salas e horários.'
    },
    {
      icon: BookOpen,
      titulo: 'Google Classroom Integrado',
      descricao: 'Tenha acesso direto a prazos, materiais e avisos de tarefas atualizados do seu Classroom institucional.'
    },
    {
      icon: FolderOpen,
      titulo: 'Explorador de Arquivos',
      descricao: 'Acesse e gerencie todos os documentos e PDF de aulas armazenados na pasta da disciplina no Google Drive.'
    },
    {
      icon: RefreshCcw,
      titulo: 'Sincronizador Local',
      descricao: 'Vincule as matérias a pastas físicas do seu computador e mantenha seus arquivos organizados automaticamente.'
    },
    {
      icon: CalendarRange,
      titulo: 'Calendário Unificado',
      descricao: 'Uma visão mensal inteligente combinando aulas regulares, provas cadastradas e datas de tarefas.'
    },
    {
      icon: CheckSquare,
      titulo: 'Frequência e Avaliações',
      descricao: 'Monitore suas faltas e controle suas notas de maneira prática, com atualização visual instantânea.'
    }
  ]

  return (
    <section id="recursos" className="py-20 md:py-28 px-4 bg-muted/20 border-b border-border">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Tudo o que você precisa para os seus estudos
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Uma plataforma completa desenvolvida sob medida para centralizar a rotina de graduação de forma automatizada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recursosList.map((recurso, index) => (
            <RevelarScroll key={index} atrasoMs={index * 100}>
              <CardRecurso
                icon={recurso.icon}
                titulo={recurso.titulo}
                descricao={recurso.descricao}
                className="h-full"
              />
            </RevelarScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

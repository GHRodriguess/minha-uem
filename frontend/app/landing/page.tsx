import { Metadata } from 'next'
import TemplateLanding from '@/components/templates/TemplateLanding'

export const metadata: Metadata = {
  title: 'Minha UEM - Recursos e Facilidades Acadêmicas',
  description: 'Conheça o Minha UEM: A plataforma inteligente de controle de horários, faltas, notas e integração com o Google Classroom para estudantes da UEM.',
  keywords: ['UEM', 'Universidade Estadual de Maringá', 'Academico', 'Horarios', 'Classroom', 'Estudantes']
}

export default function PaginaLanding() {
  return <TemplateLanding />
}

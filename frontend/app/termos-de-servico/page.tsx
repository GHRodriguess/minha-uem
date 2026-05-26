import { Metadata } from 'next'
import TemplateTermosServico from '@/components/templates/TemplateTermosServico'

export const metadata: Metadata = {
  title: 'Termos de Serviço - Minha UEM',
  description: 'Termos de Serviço e Condições de Uso da plataforma Minha UEM. Conheça as regras, responsabilidades acadêmicas e limites do sistema.',
  keywords: ['Termos de Serviço', 'Uso', 'Regras', 'Minha UEM', 'UEM', 'Estudante']
}

export default function PaginaTermosServico() {
  return <TemplateTermosServico />
}

import { Metadata } from 'next'
import TemplatePoliticaPrivacidade from '@/components/templates/TemplatePoliticaPrivacidade'

export const metadata: Metadata = {
  title: 'Política de Privacidade - Minha UEM',
  description: 'Política de Privacidade e Termos de Uso de Dados do Google no Minha UEM. Entenda como acessamos, armazenamos e protegemos seus dados.',
  keywords: ['Privacidade', 'Termos', 'Dados', 'Google Auth', 'Minha UEM', 'UEM']
}

export default function PaginaPoliticaPrivacidade() {
  return <TemplatePoliticaPrivacidade />
}

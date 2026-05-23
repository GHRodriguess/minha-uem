'use client'

import { Settings } from 'lucide-react'
import { CardPerfilUsuario } from '@/components/organisms/CardPerfilUsuario'
import { CardSincronizacaoLocal } from '@/components/organisms/CardSincronizacaoLocal'
import { CardSincronizacaoAgenda } from '@/components/organisms/CardSincronizacaoAgenda'

export default function ConfiguracoesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Configurações</h1>
        </div>
        <p className="text-muted-foreground font-medium">Gerencie seu perfil e preferências do sistema</p>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <CardPerfilUsuario />
        <div className="hidden lg:block">
          <CardSincronizacaoLocal />
        </div>
        <CardSincronizacaoAgenda />
      </div>
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { User, AlertCircle } from 'lucide-react'
import AvatarUsuario from '@/components/atoms/AvatarUsuario'

export function CardPerfilUsuario() {
  const { data: session } = useSession()

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Informações do Perfil</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dados da conta institucional</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-background ring-2 ring-primary/20 overflow-hidden shadow-xl">
            <AvatarUsuario
              src={session?.user?.image}
              alt={session?.user?.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome Completo</label>
            <div className="h-12 px-4 rounded-xl bg-muted/30 border border-border flex items-center text-sm font-bold text-foreground opacity-70 cursor-not-allowed">
              {session?.user?.name}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail Institucional</label>
            <div className="h-12 px-4 rounded-xl bg-muted/30 border border-border flex items-center text-sm font-bold text-foreground opacity-70 cursor-not-allowed">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
          As informações de perfil são sincronizadas automaticamente com sua conta do Google Workspace da UEM e não podem ser alteradas diretamente neste sistema.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSuporte } from '../providers/ProvedorSuporte'
import { suporte_servico, UsuarioAdminDet } from '@/lib/api/suporte'
import { Button } from '@/components/ui/button'
import { Shield, ShieldAlert, UserCheck } from 'lucide-react'

interface DetalheUsuarioAdminProps {
  user: UsuarioAdminDet
  onToggleStaff: (userId: number) => void
}

export default function DetalheUsuarioAdmin({ user, onToggleStaff }: DetalheUsuarioAdminProps) {
  const { data: session } = useSession()
  const { iniciarSimulacao, usuarioMe } = useSuporte()
  const [loading, setLoading] = useState(false)

  const alternarAdmin = async () => {
    if (!session?.accessToken) return
    setLoading(true)
    try {
      await suporte_servico.alternarAcessoAdmin(session.accessToken, user.id)
      onToggleStaff(user.id)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const isSelf = usuarioMe?.email === user.email

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3">
        <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Ações Administrativas</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isSelf}
            onClick={() => iniciarSimulacao(user.email, user.nome_completo)}
            className="text-[10px] font-bold rounded-xl gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Simular Conta</span>
          </Button>
          <Button
            size="sm"
            variant={user.is_staff ? "destructive" : "default"}
            disabled={isSelf || loading}
            onClick={alternarAdmin}
            className="text-[10px] font-bold rounded-xl gap-1"
          >
            {user.is_staff ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            <span>{user.is_staff ? "Remover Administrador" : "Tornar Administrador"}</span>
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Matérias Cursadas pelo Aluno</h4>
        {user.materias.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma matéria registrada para este estudante no ano letivo corrente.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {user.materias.map((m, index) => (
              <div key={index} className="p-3 rounded-xl border border-border bg-card flex flex-col gap-1 transition-all duration-200 hover:border-primary/30">
                <span className="font-mono text-[10px] font-bold text-primary">{m.codigo}</span>
                <span className="font-semibold text-xs text-foreground line-clamp-1">{m.nome}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

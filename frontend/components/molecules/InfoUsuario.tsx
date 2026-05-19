import AvatarUsuario from '../atoms/AvatarUsuario'

interface InfoUsuarioProps {
  nome: string | null | undefined
  foto: string | null | undefined
}

export default function InfoUsuario({ nome, foto }: InfoUsuarioProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-semibold text-foreground leading-none">{nome}</p>
        <p className="text-xs text-muted-foreground mt-1">Estudante</p>
      </div>
      <AvatarUsuario src={foto} alt={nome} />
    </div>
  )
}

interface AvatarUsuarioProps {
  src?: string | null
  alt?: string | null
}

export default function AvatarUsuario({ src, alt }: AvatarUsuarioProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className="w-10 h-10 rounded-full border border-border object-cover"
      />
    )
  }

  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
      <span className="text-muted-foreground font-medium">
        {alt ? alt.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
  )
}

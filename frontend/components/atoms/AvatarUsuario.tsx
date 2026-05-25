import Image from 'next/image'

interface AvatarUsuarioProps {
  src?: string | null
  alt?: string | null
  className?: string
}

export default function AvatarUsuario({ src, alt, className }: AvatarUsuarioProps) {
  const defaultClass = "w-10 h-10 rounded-full border border-border object-cover"
  const classes = className || defaultClass

  if (src) {
    return (
      <Image
        src={src}
        alt={alt || 'Avatar'}
        className={classes}
        width={40}
        height={40}
        unoptimized
      />
    )
  }

  return (
    <div className={`${classes} bg-muted flex items-center justify-center border border-border`}>
      <span className="text-muted-foreground font-medium">
        {alt ? alt.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
  )
}

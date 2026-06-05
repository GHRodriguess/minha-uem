'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import Image from 'next/image'

interface AvatarProfessorProps {
  name: string
  email: string
  photoUrl: string | null
}

export default function AvatarProfessor({ name, email, photoUrl }: AvatarProfessorProps) {
  const [imageError, setImageError] = useState(false)

  const obterIniciais = (fullName: string) => {
    const parts = fullName.trim().split(' ')
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = obterIniciais(name)

  return (
    <div className="group relative flex items-center gap-3 bg-background/40 hover:bg-background/80 border border-border/40 rounded-2xl p-2.5 transition-all duration-300">
      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0 flex items-center justify-center bg-primary/10 text-primary font-bold text-xs uppercase">
        {photoUrl && !imageError ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes="32px"
            className="object-cover"
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="flex flex-col min-w-0 pr-1">
        <span className="text-[11px] font-bold text-foreground truncate max-w-[200px] leading-tight">
          {name}
        </span>
        {email && (
          <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">
            {email}
          </span>
        )}
      </div>

      {email && (
        <a
          href={`mailto:${email}`}
          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors ml-auto"
          title={`Enviar e-mail para ${name}`}
        >
          <Mail className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  )
}

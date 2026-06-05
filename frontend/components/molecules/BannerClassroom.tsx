'use client'

import { useClassroom } from '@/components/providers/ProvedorClassroom'
import { useSession } from 'next-auth/react'
import { ExternalLink, Users } from 'lucide-react'
import AvatarProfessor from '../atoms/AvatarProfessor'
import Esqueleto from '@/components/atoms/Esqueleto'

interface BannerClassroomProps {
  materiaId: number
}

export default function BannerClassroom({ materiaId }: BannerClassroomProps) {
  const { data: session } = useSession()
  const { filesCache, loadingStates } = useClassroom()
  const connection = filesCache[materiaId]
  const loading = loadingStates[materiaId] || (!filesCache[materiaId])

  if (loading) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/40 bg-card/30 p-6 backdrop-blur-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Esqueleto className="h-4 w-24 rounded-md" />
          </div>
          <Esqueleto className="h-7 w-2/3 rounded-lg" />
          <Esqueleto className="h-4 w-32 rounded-md" />
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Esqueleto className="h-3.5 w-24 rounded-md" />
          <div className="flex gap-2">
            <Esqueleto className="h-10 w-40 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!connection || !connection.vinculado) return null

  const adicionarUsuarioAutenticadoGoogle = (url: string, email: string) => {
    if (!url || !email) return url
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('google.com') || urlObj.hostname.includes('googleapis.com')) {
        urlObj.searchParams.set('authuser', email)
        return urlObj.toString()
      }
    } catch {
      return url
    }
    return url
  }

  const teachers = connection.professores || []
  const courseName = connection.classroom_course_name || ''
  const userEmail = session?.user?.email || ''
  const linkBase = connection.classroom_alternate_link || ''
  const link = userEmail ? adicionarUsuarioAutenticadoGoogle(linkBase, userEmail) : linkBase

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border/40 bg-card/30 p-6 backdrop-blur-md shadow-sm transition-all duration-300 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
            Google Classroom
          </span>
        </div>
        
        <h2 className="text-xl font-black text-foreground tracking-tight">
          {courseName}
        </h2>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-wider"
          >
            Abrir Sala de Aula
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {teachers.length > 0 && (
        <div className="flex flex-col gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            <Users className="w-3 h-3" />
            {teachers.length == 1 ?  'Professor(a)' : 'Professores(as)'}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {teachers.map((teacher) => (
              <AvatarProfessor
                key={teacher.google_user_id}
                name={teacher.name}
                email={teacher.email}
                photoUrl={teacher.photo_url}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

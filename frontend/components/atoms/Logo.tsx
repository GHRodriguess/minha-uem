import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <GraduationCap className="w-6 h-6" />
      </div>
      <span className="text-xl font-bold text-foreground tracking-tight">Minha UEM</span>
    </Link>
  )
}

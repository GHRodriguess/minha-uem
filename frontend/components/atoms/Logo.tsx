import { GraduationCap } from 'lucide-react'

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg">
        <GraduationCap className="w-6 h-6 text-foreground dark:text-primary-foreground" />
      </div>
      <span className="text-xl font-bold text-foreground">Minha UEM</span>
    </div>
  )
}

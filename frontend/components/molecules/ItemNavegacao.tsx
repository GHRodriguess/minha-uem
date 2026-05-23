import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface ItemNavegacaoProps {
  href: string
  icon: LucideIcon
  label: string
  active?: boolean
  badge?: React.ReactNode
  onClick?: () => void
}

export default function ItemNavegacao({ href, icon: Icon, label, active, badge, onClick }: ItemNavegacaoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={clsx("w-5 h-5", active ? "text-primary-foreground" : "group-hover:text-foreground")} />
        <span className="font-medium">{label}</span>
      </div>
      {badge}
    </Link>
  )
}

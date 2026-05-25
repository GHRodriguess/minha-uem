import { cn } from '@/lib/utils'

type EsqueletoProps = React.HTMLAttributes<HTMLDivElement>

export default function Esqueleto({ className, ...props }: EsqueletoProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

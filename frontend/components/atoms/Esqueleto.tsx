import { cn } from '@/lib/utils'

interface EsqueletoProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Esqueleto({ className, ...props }: EsqueletoProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

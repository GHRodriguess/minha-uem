import Esqueleto from '@/components/atoms/Esqueleto'

export default function EsqueletoChamado() {
  return (
    <div className="p-4 bg-card border border-border rounded-2xl flex flex-col gap-2">
      <Esqueleto className="h-4 w-3/4 rounded" />
      <div className="flex justify-between items-center">
        <Esqueleto className="h-4.5 w-16 rounded-full" />
        <Esqueleto className="h-3.5 w-12 rounded" />
      </div>
    </div>
  )
}

import Esqueleto from '@/components/atoms/Esqueleto'

export default function EsqueletoNoticia() {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl space-y-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-center">
        <Esqueleto className="h-4 w-24 rounded" />
        <Esqueleto className="h-4 w-28 rounded" />
      </div>
      <Esqueleto className="h-6 w-3/4" />
      <div className="space-y-2">
        <Esqueleto className="h-3 w-full" />
        <Esqueleto className="h-3 w-5/6" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Esqueleto className="h-4 w-32 rounded" />
        <div className="flex gap-2">
          <Esqueleto className="h-8 w-8 rounded-lg" />
          <Esqueleto className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

import Esqueleto from '@/components/atoms/Esqueleto'

export default function EsqueletoCardDisciplina() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-70">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2 flex-1">
            <Esqueleto className="h-6 w-3/4" />
            <Esqueleto className="h-4 w-1/2" />
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Esqueleto className="h-5 w-16 rounded" />
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Esqueleto className="h-3 w-24" />
              <Esqueleto className="h-8 w-16" />
            </div>
            <Esqueleto className="h-4 w-16" />
          </div>

          <Esqueleto className="w-full h-2.5 rounded-full" />
          <Esqueleto className="h-4 w-28 rounded" />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border flex justify-between">
        <Esqueleto className="h-3 w-20" />
        <Esqueleto className="h-3 w-20" />
      </div>
    </div>
  )
}

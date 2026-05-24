import Esqueleto from '@/components/atoms/Esqueleto'

export default function EsqueletoCardMensagemMural() {
  const attachments = [1, 2]

  return (
    <div className="bg-card rounded-3xl border border-l-4 border-l-muted p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex items-start gap-4">
        <Esqueleto className="w-11 h-11 rounded-2xl shrink-0 animate-pulse" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Esqueleto className="h-4 w-12 rounded" />
            <Esqueleto className="h-3 w-32" />
          </div>
          <Esqueleto className="h-6 w-1/2 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <Esqueleto className="h-4 w-full" />
        <Esqueleto className="h-4 w-5/6" />
        <Esqueleto className="h-4 w-2/3" />
      </div>

      <div className="border-t border-border pt-5 space-y-3">
        <Esqueleto className="h-3 w-28" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attachments.map((index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
              <Esqueleto className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Esqueleto className="h-3 w-3/4" />
                <Esqueleto className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

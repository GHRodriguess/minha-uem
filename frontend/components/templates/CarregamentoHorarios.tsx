import Esqueleto from '@/components/atoms/Esqueleto'

export default function CarregamentoHorarios() {
  const weekDays = [1, 2, 3, 4, 5, 6, 7]
  const calendarDays = Array.from({ length: 35 }, (_, idx) => idx)
  const events = [1, 2]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section className="space-y-2">
        <Esqueleto className="h-9 w-60" />
        <Esqueleto className="h-5 w-80" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <Esqueleto className="h-6 w-32" />
              <div className="flex gap-2">
                <Esqueleto className="h-8 w-8 rounded-lg" />
                <Esqueleto className="h-8 w-8 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((index) => (
                <Esqueleto key={index} className="h-5 w-full rounded" />
              ))}
              {calendarDays.map((index) => (
                <Esqueleto key={index} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <Esqueleto className="h-5 w-24" />
            <div className="flex gap-3">
              <Esqueleto className="h-6 w-16 rounded-full" />
              <Esqueleto className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <Esqueleto className="h-6 w-40" />
              <Esqueleto className="h-4 w-24" />
            </div>
            <div className="space-y-4">
              {events.map((index) => (
                <div key={index} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <Esqueleto className="h-5 w-1/3" />
                      <Esqueleto className="h-3 w-1/4" />
                    </div>
                    <Esqueleto className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

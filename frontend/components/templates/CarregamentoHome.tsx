import Esqueleto from '@/components/atoms/Esqueleto'

export default function CarregamentoHome() {
  const cards = [1, 2, 3, 4]
  const subjects = [1, 2, 3, 4]
  const schedule = [1, 2, 3]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section>
        <Esqueleto className="h-9 w-48" />
        <Esqueleto className="h-5 w-72 mt-2" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((index) => (
          <div key={index} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <Esqueleto className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Esqueleto className="h-4 w-16" />
              <Esqueleto className="h-6 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Esqueleto className="h-7 w-40 mb-6" />
          <div className="space-y-4">
            {subjects.map((index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="space-y-2 flex-1">
                  <Esqueleto className="h-5 w-1/3" />
                  <Esqueleto className="h-3 w-1/4" />
                </div>
                <Esqueleto className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Esqueleto className="h-7 w-32 mb-6" />
          <div className="space-y-4">
            {schedule.map((index) => (
              <div key={index} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Esqueleto className="h-5 w-2/3" />
                    <Esqueleto className="h-3 w-1/3" />
                  </div>
                  <Esqueleto className="h-8 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import Esqueleto from '@/components/atoms/Esqueleto'

export default function CarregamentoDetalheDisciplina() {
  const grades = [1, 2, 3]
  const sidebarCards = [1, 2, 3]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <section className="flex flex-col gap-4">
        <Esqueleto className="h-4 w-32" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Esqueleto className="h-5 w-16 rounded" />
            <Esqueleto className="h-4 w-36" />
          </div>
          <Esqueleto className="h-10 w-96" />
        </div>
      </section>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-100">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Esqueleto className="w-11 h-11 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Esqueleto className="h-6 w-40" />
                  <Esqueleto className="h-4 w-60" />
                </div>
              </div>
              <div className="space-y-4">
                {grades.map((index) => (
                  <div key={index} className="flex justify-between items-center py-4 border-b border-border">
                    <Esqueleto className="h-5 w-1/3" />
                    <Esqueleto className="h-8 w-16 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {sidebarCards.map((index) => (
              <div key={index} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <Esqueleto className="h-5 w-24" />
                  <Esqueleto className="h-4 w-12" />
                </div>
                <Esqueleto className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-4">
          <Esqueleto className="h-6 w-36" />
          <Esqueleto className="h-4 w-60" />
          <div className="space-y-2">
            <Esqueleto className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

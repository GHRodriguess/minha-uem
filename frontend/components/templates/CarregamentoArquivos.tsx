import Esqueleto from '@/components/atoms/Esqueleto'

export default function CarregamentoArquivos() {
  const cards = [1, 2, 3]
  const rows = [1, 2, 3, 4, 5]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <section className="flex flex-col gap-4">
        <Esqueleto className="h-4 w-32" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Esqueleto className="h-5 w-24 rounded" />
              <Esqueleto className="h-4 w-40" />
            </div>
            <Esqueleto className="h-10 w-96" />
            <Esqueleto className="h-4 w-60" />
          </div>
          <Esqueleto className="h-10 w-44 rounded-xl" />
        </div>
      </section>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((index) => (
            <div key={index} className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <Esqueleto className="w-14 h-14 rounded-2xl animate-pulse" />
              <div className="space-y-2 flex-1">
                <Esqueleto className="h-3 w-20" />
                <Esqueleto className="h-6 w-10" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <Esqueleto className="h-5 w-40" />
            <Esqueleto className="h-8 w-24 rounded-lg" />
          </div>
          <div className="space-y-3">
            {rows.map((index) => (
              <div key={index} className="flex items-center gap-4 py-3">
                <Esqueleto className="w-8 h-8 rounded-lg animate-pulse" />
                <div className="space-y-2 flex-1">
                  <Esqueleto className="h-4 w-1/3" />
                  <Esqueleto className="h-3 w-1/4" />
                </div>
                <Esqueleto className="w-20 h-6 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

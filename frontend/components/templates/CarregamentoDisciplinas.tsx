import Esqueleto from '@/components/atoms/Esqueleto'
import EsqueletoCardDisciplina from '@/components/atoms/EsqueletoCardDisciplina'

export default function CarregamentoDisciplinas() {
  const cards = [1, 2, 3, 4]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Esqueleto className="h-9 w-60" />
          <Esqueleto className="h-5 w-80" />
        </div>

        <div className="flex gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border">
          <Esqueleto className="h-9 w-28 rounded-xl" />
          <Esqueleto className="h-9 w-36 rounded-xl" />
          <Esqueleto className="h-9 w-36 rounded-xl" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((index) => (
          <EsqueletoCardDisciplina key={index} />
        ))}
      </div>
    </div>
  )
}

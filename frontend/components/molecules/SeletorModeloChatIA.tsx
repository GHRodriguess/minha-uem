'use client'

interface SeletorModeloChatIAProps {
  modelName: string
  onChangeModel: (modelo: string) => void
}

export default function SeletorModeloChatIA({
  modelName,
  onChangeModel
}: SeletorModeloChatIAProps) {
  const models = [
    ['gemini-3.5-flash', 'Gemini 3.5 Flash'],
    ['gemini-3.1-flash-lite', 'Gemini 3.1 Lite'],
    ['gemini-2.5-flash', 'Gemini 2.5 Flash'],
    ['gemini-2.5-pro', 'Gemini 2.5 Pro']
  ]

  return (
    <div className="px-4 py-2 border-b border-border bg-muted/5 flex items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-muted-foreground">Modelo ativo:</span>
      <select
        value={modelName}
        onChange={(e) => onChangeModel(e.target.value)}
        className="bg-transparent text-foreground border-none font-bold focus:outline-none cursor-pointer text-xs dark:bg-[#181818]"
      >
        {models.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}

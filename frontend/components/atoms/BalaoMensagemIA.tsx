'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface BalaoMensagemIAProps {
  text: string
  isUser: boolean
}

export default function BalaoMensagemIA({ text, isUser }: BalaoMensagemIAProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-none whitespace-pre-wrap'
            : 'bg-muted/50 border border-border text-foreground rounded-tl-none'
        }`}
      >
        {isUser ? (
          text
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-extrabold text-foreground">{children}</strong>,
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match
                if (isInline) {
                  return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                }
                return (
                  <div className="my-3 rounded-xl overflow-hidden border border-border bg-zinc-950 text-xs font-mono">
                    <div className="bg-zinc-900/60 px-4 py-2 border-b border-border flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <span>{match[1]}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                        className="hover:text-foreground transition-colors cursor-pointer capitalize font-semibold"
                      >
                        Copiar
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto whitespace-pre">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                )
              }
            }}
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

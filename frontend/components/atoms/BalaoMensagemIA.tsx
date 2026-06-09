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
            }}
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

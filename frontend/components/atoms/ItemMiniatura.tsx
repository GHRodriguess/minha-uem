'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ItemMiniaturaProps {
  pdfDocument: any
  pageNumber: number
  isActive: boolean
  onClick: () => void
}

export function ItemMiniatura({
  pdfDocument,
  pageNumber,
  isActive,
  onClick
}: ItemMiniaturaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const renderizarMiniaturaPagina = async () => {
      if (!pdfDocument || !canvasRef.current) return
      
      try {
        const page = await pdfDocument.getPage(pageNumber)
        if (!active) return

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context || !active) return

        const viewport = page.getViewport({ scale: 0.25 })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        await page.render(renderContext).promise
        
        if (active) {
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
      }
    }

    renderizarMiniaturaPagina()

    return () => {
      active = false
    }
  }, [pdfDocument, pageNumber])

  const styleBase = 'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer'
  const styleEstado = isActive
    ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
    : 'bg-card border-border/40 hover:bg-muted/30 hover:border-border'

  return (
    <div
      onClick={onClick}
      className={`${styleBase} ${styleEstado}`}
    >
      <div className="relative border border-border/20 rounded-md overflow-hidden bg-background flex items-center justify-center min-w-[70px] min-h-[90px] shadow-sm">
        <canvas ref={canvasRef} className={`w-full max-w-[80px] object-contain ${loading ? 'opacity-0' : 'opacity-100'}`} />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
            <span className="w-4 h-4 rounded-full border border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-black text-muted-foreground">{pageNumber}</span>
    </div>
  )
}

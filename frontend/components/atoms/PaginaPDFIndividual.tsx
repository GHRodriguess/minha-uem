'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'

interface PaginaPDFIndividualProps {
  pdfDocument: any
  pageNumber: number
  scale: number
  rotation: number
  onVisible: (pageNumber: number) => void
  containerDeScrollRef?: React.RefObject<HTMLDivElement | null>
  searchTerm?: string
}

export function PaginaPDFIndividual({
  pdfDocument,
  pageNumber,
  scale,
  rotation,
  onVisible,
  containerDeScrollRef,
  searchTerm = ''
}: PaginaPDFIndividualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<any>(null)

  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const [highlights, setHighlights] = useState<any[]>([])

  useEffect(() => {
    let active = true

    const carregarDimensoes = async () => {
      if (!pdfDocument) return
      try {
        const page = await pdfDocument.getPage(pageNumber)
        if (!active) return
        const viewport = page.getViewport({ scale, rotation })
        setDimensions({ width: viewport.width, height: viewport.height })
      } catch (err) {
        console.error(err)
      }
    }

    carregarDimensoes()

    return () => {
      active = false
    }
  }, [pdfDocument, pageNumber, scale, rotation])

  useEffect(() => {
    let active = true

    const desenharPaginaCompleta = async () => {
      if (!pdfDocument || !canvasRef.current || !hasBeenVisible) return

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
      }

      try {
        const page = await pdfDocument.getPage(pageNumber)
        if (!active) return

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context || !active) return

        const devicePixelRatio = window.devicePixelRatio || 1
        const scaleAdjusted = scale * devicePixelRatio
        const viewport = page.getViewport({ scale: scaleAdjusted, rotation })

        canvas.width = viewport.width
        canvas.height = viewport.height

        canvas.style.width = `${viewport.width / devicePixelRatio}px`
        canvas.style.height = `${viewport.height / devicePixelRatio}px`

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        const task = page.render(renderContext)
        renderTaskRef.current = task

        await task.promise
        renderTaskRef.current = null

        if (textLayerRef.current && active) {
          try {
            const textLayerDiv = textLayerRef.current
            textLayerDiv.innerHTML = ''
            const textContent = await page.getTextContent()
            const textLayer = new pdfjs.TextLayer({
              textContentSource: textContent,
              container: textLayerDiv,
              viewport: page.getViewport({ scale, rotation })
            })
            await textLayer.render()
          } catch (layerErr) {
            console.error(layerErr)
          }
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(err)
        }
      }
    }

    desenharPaginaCompleta()

    return () => {
      active = false
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
      }
    }
  }, [pdfDocument, pageNumber, scale, rotation, hasBeenVisible])

  useEffect(() => {
    let active = true

    const extrairDestaquesTextuais = async () => {
      if (!pdfDocument || !searchTerm.trim() || !dimensions) {
        setHighlights([])
        return
      }

      try {
        const page = await pdfDocument.getPage(pageNumber)
        if (!active) return

        const content = await page.getTextContent()
        if (!active) return

        const viewport = page.getViewport({ scale, rotation })
        const list: any[] = []

        for (const item of content.items as any[]) {
          const str = item.str
          const lowerStr = str.toLowerCase()
          const lowerTerm = searchTerm.toLowerCase()

          let startIndex = lowerStr.indexOf(lowerTerm)
          while (startIndex !== -1) {
            const charWidth = item.width / str.length
            const xOffset = startIndex * charWidth
            const wordWidth = lowerTerm.length * charWidth

            const transform = item.transform
            const x = transform[4] + xOffset
            const y = transform[5]
            const w = wordWidth
            const h = item.height || transform[3] || 12

            const pt1 = viewport.convertToViewportPoint(x, y)
            const pt2 = viewport.convertToViewportPoint(x + w, y + h)

            list.push({
              left: Math.min(pt1[0], pt2[0]),
              top: Math.min(pt1[1], pt2[1]),
              width: Math.abs(pt2[0] - pt1[0]),
              height: Math.abs(pt2[1] - pt1[1]),
              text: str.substring(startIndex, startIndex + lowerTerm.length)
            })

            startIndex = lowerStr.indexOf(lowerTerm, startIndex + lowerTerm.length)
          }
        }

        if (active) {
          setHighlights(list)
        }
      } catch (err) {
        console.error(err)
      }
    }

    extrairDestaquesTextuais()

    return () => {
      active = false
    }
  }, [pdfDocument, pageNumber, searchTerm, scale, rotation, dimensions])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasBeenVisible(true)
            onVisible(pageNumber)
          }
        })
      },
      {
        threshold: 0.15,
        root: containerDeScrollRef?.current || null
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [pageNumber, onVisible, containerDeScrollRef])

  const widthEst = dimensions ? dimensions.width : scale * 595
  const heightEst = dimensions ? dimensions.height : scale * 842

  return (
    <div
      ref={containerRef}
      style={{
        width: `${widthEst}px`,
        height: `${heightEst}px`
      }}
      className="bg-background shadow-md border border-border/20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center mb-6 transition-all duration-200 relative select-text"
    >
      <style>{`
        .pdf-text-layer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 1;
          line-height: 1.0 !important;
          text-size-adjust: none !important;
          forced-color-adjust: none !important;
          transform-origin: 0 0;
          z-index: 2;
          pointer-events: auto;
          text-align: initial !important;
        }
        .pdf-text-layer span {
          color: transparent !important;
          position: absolute;
          white-space: pre !important;
          cursor: text !important;
          transform-origin: 0 0 !important;
          line-height: 1.0 !important;
          font-family: sans-serif !important;
        }
        .pdf-text-layer ::selection {
          background: rgba(59, 130, 246, 0.3) !important;
          color: transparent !important;
        }
      `}</style>
      {hasBeenVisible ? (
        <>
          <canvas ref={canvasRef} />
          <div ref={textLayerRef} className="pdf-text-layer" />
          {highlights.map((hl, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${hl.left}px`,
                top: `${hl.top}px`,
                width: `${hl.width}px`,
                height: `${hl.height}px`
              }}
              className="bg-yellow-500/25 border border-yellow-500/40 rounded-sm pointer-events-none z-10 animate-in fade-in duration-200 shadow-sm"
              title={hl.text}
            />
          ))}
        </>
      ) : (
        <div className="absolute inset-0 bg-muted/40 animate-pulse flex items-center justify-center">
          <span className="w-6 h-6 rounded-full border border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}

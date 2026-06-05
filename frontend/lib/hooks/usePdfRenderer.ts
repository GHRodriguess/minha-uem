'use client'

import { useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { normalizarTexto, agruparItensTexto } from '@/lib/utils'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export function usePdfRenderer() {
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [matches, setMatches] = useState<{ page: number }[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)

  const carregarPdf = useCallback(async (url: string) => {
    if (!url) return
    setLoading(true)
    try {
      const loadingTask = pdfjs.getDocument({
        url,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.370/cmaps/',
        cMapPacked: true
      })
      const doc = await loadingTask.promise
      setPdfDocument(doc)
      setTotalPages(doc.numPages)
      setCurrentPage(1)
      setScale(1.0)
      setRotation(0)
      setSearchTerm('')
      setMatches([])
      setCurrentMatchIndex(-1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const alterarZoom = useCallback((action: 'in' | 'out' | 'fit') => {
    setScale(prev => {
      if (action === 'in') return Math.min(prev + 0.2, 3.0)
      if (action === 'out') return Math.max(prev - 0.2, 0.5)
      return 1.0
    })
  }, [])

  const alterarRotacao = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const irParaPagina = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const buscarTexto = useCallback(async (term: string) => {
    setSearchTerm(term)
    if (!pdfDocument || !term.trim()) {
      setMatches([])
      setCurrentMatchIndex(-1)
      return
    }

    const normalizedTerm = normalizarTexto(term)

    try {
      const occurrences: { page: number }[] = []
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDocument.getPage(i)
        const content = await page.getTextContent()

        const groupedItems = agruparItensTexto(content.items)

        for (const item of groupedItems) {
          const str = item.str
          const normalizedStr = normalizarTexto(str)

          let index = normalizedStr.indexOf(normalizedTerm)
          while (index !== -1) {
            occurrences.push({ page: i })
            index = normalizedStr.indexOf(normalizedTerm, index + normalizedTerm.length)
          }
        }
      }

      setMatches(occurrences)
      if (occurrences.length > 0) {
        setCurrentMatchIndex(0)
        setCurrentPage(occurrences[0].page)
      } else {
        setCurrentMatchIndex(-1)
      }
    } catch (err) {
      console.error(err)
    }
  }, [pdfDocument, totalPages])

  const proximoMatch = useCallback(() => {
    if (matches.length === 0) return
    setCurrentMatchIndex(prev => {
      const nextIndex = (prev + 1) % matches.length
      setCurrentPage(matches[nextIndex].page)
      return nextIndex
    })
  }, [matches])

  const matchAnterior = useCallback(() => {
    if (matches.length === 0) return
    setCurrentMatchIndex(prev => {
      const prevIndex = (prev - 1 + matches.length) % matches.length
      setCurrentPage(matches[prevIndex].page)
      return prevIndex
    })
  }, [matches])

  return {
    pdfDocument,
    currentPage,
    totalPages,
    scale,
    rotation,
    loading,
    searchTerm,
    matches,
    currentMatchIndex,
    carregarPdf,
    alterarZoom,
    alterarRotacao,
    irParaPagina,
    buscarTexto,
    proximoMatch,
    matchAnterior
  }
}

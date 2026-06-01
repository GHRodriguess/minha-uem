'use client'

import React, { useState, useEffect } from 'react'

interface IndicadorPaginaProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function IndicadorPagina({
  currentPage,
  totalPages,
  onPageChange
}: IndicadorPaginaProps) {
  const [inputValue, setInputValue] = useState(currentPage.toString())

  useEffect(() => {
    setInputValue(currentPage.toString())
  }, [currentPage])

  const lidarComMudanca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const confirmarMudanca = () => {
    const pageNum = parseInt(inputValue, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum)
    } else {
      setInputValue(currentPage.toString())
    }
  }

  const tratarTeclas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmarMudanca()
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setInputValue(currentPage.toString())
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-semibold text-muted-foreground select-none shrink-0 shadow-sm">
      <input
        type="text"
        value={inputValue}
        onChange={lidarComMudanca}
        onBlur={confirmarMudanca}
        onKeyDown={tratarTeclas}
        className="w-8 h-5 text-center bg-muted border border-border rounded-md font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">de</span>
      <span className="font-bold text-foreground">{totalPages || 1}</span>
    </div>
  )
}

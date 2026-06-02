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
    <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-background/60 border border-border/40 backdrop-blur-md rounded-xl text-xs font-semibold text-foreground select-none shrink-0 transition-all duration-200 hover:bg-background/80">
      <input
        type="text"
        value={inputValue}
        onChange={lidarComMudanca}
        onBlur={confirmarMudanca}
        onKeyDown={tratarTeclas}
        className="w-7 sm:w-8 h-4 sm:h-5 text-center bg-transparent border border-transparent rounded-md font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
      <span className="text-[10px] font-black uppercase tracking-wider text-foreground/60">de</span>
      <span className="font-bold text-foreground">{totalPages || 1}</span>
    </div>
  )
}

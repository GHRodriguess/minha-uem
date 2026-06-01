'use client'

import React from 'react'
import { ItemMiniatura } from '@/components/atoms/ItemMiniatura'

interface SidebarMiniaturasProps {
  isOpen: boolean
  pdfDocument: any
  currentPage: number
  onPageChange: (page: number) => void
  totalPages: number
}

export function SidebarMiniaturas({
  isOpen,
  pdfDocument,
  currentPage,
  onPageChange,
  totalPages
}: SidebarMiniaturasProps) {
  if (!isOpen || !pdfDocument) return null

  const renderizarItems = () => {
    const list = []
    for (let index = 1; index <= totalPages; index++) {
      list.push(
        <ItemMiniatura
          key={index}
          pdfDocument={pdfDocument}
          pageNumber={index}
          isActive={currentPage === index}
          onClick={() => onPageChange(index)}
        />
      )
    }
    return list
  }

  return (
    <div className="w-28 flex flex-col h-full bg-card border-r border-border overflow-y-auto shrink-0 p-3 gap-3 scrollbar-thin select-none animate-in slide-in-from-left duration-200">
      <div className="flex flex-col gap-3">
        {renderizarItems()}
      </div>
    </div>
  )
}

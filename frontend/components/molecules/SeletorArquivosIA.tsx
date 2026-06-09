'use client'

import { useState } from 'react'
import { Paperclip, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { ArquivoClassroom } from '@/lib/api/classroom'

interface SeletorArquivosIAProps {
  files: ArquivoClassroom[]
  selectedIds: string[]
  onToggle: (fileId: string) => void
}

export default function SeletorArquivosIA({
  files,
  selectedIds,
  onToggle
}: SeletorArquivosIAProps) {
  const [isOpen, setIsOpen] = useState(false)
  const validFiles = files.filter(f => !f.is_ignored)

  if (validFiles.length === 0) return null

  return (
    <div className="border border-border rounded-2xl bg-muted/10 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-all font-bold text-foreground"
      >
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <span>Anexar materiais da disciplina</span>
          {selectedIds.length > 0 && (
            <span className="bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-full text-[10px]">
              {selectedIds.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="max-h-40 overflow-y-auto p-3 space-y-2 border-t border-border bg-background/50 divide-y divide-border/50">
          {validFiles.map(fileItem => {
            const isSelected = selectedIds.includes(fileItem.drive_file_id)
            return (
              <label
                key={fileItem.drive_file_id}
                className="flex items-start gap-2.5 pt-2 first:pt-0 cursor-pointer select-none font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(fileItem.drive_file_id)}
                  className="rounded border-border text-primary focus:ring-primary/20 mt-0.5"
                />
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{fileItem.custom_name || fileItem.original_name}</span>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

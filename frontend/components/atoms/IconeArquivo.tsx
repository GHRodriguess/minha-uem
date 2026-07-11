'use client'

import React from 'react'
import { 
  FileSignature, 
  FileSpreadsheet, 
  FileImage, 
  FileText, 
  FileVideo, 
  FileCode, 
  FileBox 
} from 'lucide-react'

interface IconeArquivoProps {
  filename: string
}

export function IconeArquivo({ filename }: IconeArquivoProps) {
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  if (extension === 'pdf') {
    return (
      <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0">
        <FileSignature className="w-4 h-4 text-red-500" />
      </div>
    )
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return (
      <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shrink-0">
        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
      </div>
    )
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
    return (
      <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0">
        <FileImage className="w-4 h-4 text-amber-500" />
      </div>
    )
  }
  if (['doc', 'docx', 'odt'].includes(extension)) {
    return (
      <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0">
        <FileText className="w-4 h-4 text-blue-500" />
      </div>
    )
  }
  if (['mp4', 'mkv', 'webm', 'ogg', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp'].includes(extension)) {
    return (
      <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0">
        <FileVideo className="w-4 h-4 text-indigo-500" />
      </div>
    )
  }
  if (['py', 'js', 'ts', 'html', 'css', 'json', 'md', 'java', 'cpp', 'c', 'sql', 'sh', 'yml', 'yaml'].includes(extension)) {
    return (
      <div className="p-1.5 bg-amber-500/15 border border-amber-500/25 rounded-xl shrink-0">
        <FileCode className="w-4 h-4 text-amber-600" />
      </div>
    )
  }
  if (extension === 'txt') {
    return (
      <div className="p-1.5 bg-zinc-500/10 border border-zinc-500/20 rounded-xl shrink-0">
        <FileText className="w-4 h-4 text-zinc-500" />
      </div>
    )
  }
  return (
    <div className="p-1.5 bg-muted border border-border/30 rounded-xl shrink-0">
      <FileBox className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}

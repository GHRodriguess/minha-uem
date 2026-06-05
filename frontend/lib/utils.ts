import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizarTexto(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00b4\u0060\u005e\u007e\u00a8\u00b8\u02c6\u02c8\u02dc]/g, '')
    .toLowerCase()
}

export function agruparItensTexto(items: any[]): any[] {
  const result: any[] = []
  for (const item of items) {
    if (result.length > 0) {
      const prev = result[result.length - 1]
      const isCurrentAccent = /^[\u00b4\u0060\u005e\u007e\u00a8\u00b8\u02c6\u02c8\u02dc\s]+$/.test(item.str)
      const sameLine = prev.transform && item.transform && Math.abs(prev.transform[5] - item.transform[5]) < 2

      if (isCurrentAccent || (sameLine && !prev.str.endsWith(' ') && !item.str.startsWith(' '))) {
        prev.str += item.str
        prev.width += item.width
        continue
      }
    }
    result.push({ ...item })
  }
  return result
}


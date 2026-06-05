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
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/[²]/g, '2')
    .replace(/[³]/g, '3')
    .replace(/[¹]/g, '1')
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

export function corrigirTextoCopiado(text: string): string {
  let corrected = text
  const replacements: [RegExp, string][] = [
    [/¸c/g, 'ç'], [/c¸/g, 'ç'],
    [/¸C/g, 'Ç'], [/C¸/g, 'Ç'],
    [/˜a/g, 'ã'], [/a˜/g, 'ã'],
    [/˜o/g, 'õ'], [/o˜/g, 'õ'],
    [/˜A/g, 'Ã'], [/A˜/g, 'Ã'],
    [/˜O/g, 'Õ'], [/O˜/g, 'Õ'],
    [/~a/g, 'ã'], [/a~/g, 'ã'],
    [/~o/g, 'õ'], [/o~/g, 'õ'],
    [/~A/g, 'Ã'], [/A~/g, 'Ã'],
    [/~O/g, 'Õ'], [/O~/g, 'Õ'],
    [/´a/g, 'á'], [/a´/g, 'á'],
    [/´e/g, 'é'], [/e´/g, 'é'],
    [/´i/g, 'í'], [/i´/g, 'í'],
    [/´o/g, 'ó'], [/o´/g, 'ó'],
    [/´u/g, 'ú'], [/u´/g, 'ú'],
    [/´A/g, 'Á'], [/A´/g, 'Á'],
    [/´E/g, 'É'], [/E´/g, 'É'],
    [/´I/g, 'Í'], [/I´/g, 'Í'],
    [/´U/g, 'Ú'], [/U´/g, 'Ú'],
    [/´ı/g, 'í'], [/ı´/g, 'í'],
    [/´I/g, 'Í'], [/I´/g, 'Í'],
    [/ˆa/g, 'â'], [/aˆ/g, 'â'],
    [/ˆe/g, 'ê'], [/eˆ/g, 'ê'],
    [/ˆo/g, 'ô'], [/oˆ/g, 'ô'],
    [/ˆA/g, 'Â'], [/Aˆ/g, 'Â'],
    [/ˆE/g, 'Ê'], [/Eˆ/g, 'Ê'],
    [/ˆO/g, 'Ô'], [/Oˆ/g, 'Ô'],
    [/\^a/g, 'â'], [/a\^/g, 'â'],
    [/\^e/g, 'ê'], [/e\^/g, 'ê'],
    [/\^o/g, 'ô'], [/o\^/g, 'ô'],
    [/\^A/g, 'Â'], [/A\^/g, 'Â'],
    [/\^E/g, 'Ê'], [/E\^/g, 'Ê'],
    [/\^O/g, 'Ô'], [/O\^/g, 'Ô'],
    [/`a/g, 'à'], [/a`/g, 'à'],
    [/`A/g, 'À'], [/A`/g, 'À'],
    [/ı/g, 'i'], [/İ/g, 'I']
  ]
  for (const [pattern, replacement] of replacements) {
    corrected = corrected.replace(pattern, replacement)
  }
  return corrected
}

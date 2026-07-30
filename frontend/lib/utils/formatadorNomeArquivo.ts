export function obterExtensao(fileName: string): string {
  if (!fileName || !fileName.includes('.')) return ''
  const parts = fileName.split('.')
  if (parts.length === 1 || (parts.length === 2 && parts[0] === '')) return ''
  return parts.pop() || ''
}

export function obterNomeSemExtensao(fileName: string): string {
  if (!fileName) return ''
  const file_ext = obterExtensao(fileName)
  if (!file_ext) return fileName
  return fileName.slice(0, -(file_ext.length + 1))
}

export function obterNomeComExtensao(novoNome: string, nomeReferencia: string): string {
  const trimmed_name = novoNome.trim()
  if (!trimmed_name) return nomeReferencia

  const ref_ext = obterExtensao(nomeReferencia)
  if (!ref_ext) return trimmed_name

  const ext_suffix = `.${ref_ext.toLowerCase()}`
  if (trimmed_name.toLowerCase().endsWith(ext_suffix)) {
    return trimmed_name
  }

  return `${trimmed_name}.${ref_ext}`
}

export function obterNomeExibicao(customName?: string | null, originalName?: string): string {
  const target_name = customName || originalName || ''
  return obterNomeSemExtensao(target_name)
}


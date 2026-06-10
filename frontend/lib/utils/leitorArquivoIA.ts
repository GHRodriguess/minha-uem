import { obterBlobGoogleDrive } from '@/lib/utils/googleDrive'
import { GerenciadorDiretorio } from '@/lib/utils/gerenciadorDiretorio'

interface ArquivoBase64 {
  mime_type: string
  base64_data: string
}

export async function obterArquivosBase64(
  fileIds: string[],
  fileUrls: Record<string, string> | undefined,
  arquivosMateria: any[],
  directoryHandle: FileSystemDirectoryHandle | null,
  hasFolderPermission: boolean,
  googleToken: string | null
): Promise<ArquivoBase64[]> {
  const results: ArquivoBase64[] = []

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1] || '')
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  for (const id of fileIds) {
    try {
      let blob: Blob | null = null

      if (fileUrls && fileUrls[id]) {
        const res = await fetch(fileUrls[id])
        blob = await res.blob()
      } else {
        const item = arquivosMateria.find(f => f.drive_file_id === id)
        if (item && item.local_path && directoryHandle && hasFolderPermission) {
          const parts = item.local_path.split('/')
          const name = parts.pop() || item.original_name
          blob = await GerenciadorDiretorio.lerArquivoLocal(directoryHandle, parts, name)
        } else if (!id.startsWith('local_') && googleToken) {
          blob = await obterBlobGoogleDrive(id, googleToken)
        }
      }

      if (blob && blob.size <= 15 * 1024 * 1024) {
        const base64Data = await blobToBase64(blob)
        results.push({
          mime_type: blob.type || 'application/pdf',
          base64_data: base64Data
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  return results
}

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function useSincronizarUrlVisualizador(leftFileId: string | null, rightFileId: string | null) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString())
    let isChanged = false

    if (leftFileId) {
      if (params.get('fileId') !== leftFileId) {
        params.set('fileId', leftFileId)
        isChanged = true
      }
    } else {
      if (params.has('fileId')) {
        params.delete('fileId')
        isChanged = true
      }
    }

    if (rightFileId) {
      if (params.get('rightFileId') !== rightFileId) {
        params.set('rightFileId', rightFileId)
        isChanged = true
      }
    } else {
      if (params.has('rightFileId')) {
        params.delete('rightFileId')
        isChanged = true
      }
    }

    if (isChanged) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [leftFileId, rightFileId, pathname, router, searchParams])
}

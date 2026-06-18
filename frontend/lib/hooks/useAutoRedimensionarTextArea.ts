import { useEffect, RefObject } from 'react'

export default function useAutoRedimensionarTextArea(
  textAreaRef: RefObject<HTMLTextAreaElement | null>,
  inputValue: string
) {
  useEffect(() => {
    const textarea = textAreaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    if (inputValue) {
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [textAreaRef, inputValue])
}

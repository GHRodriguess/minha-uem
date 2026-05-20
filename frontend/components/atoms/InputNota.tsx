'use client'

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputNotaProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function InputNota({ value, onChange, placeholder = "0.00", className, disabled }: InputNotaProps) {
  const formatarValor = (val: number | null) => {
    if (val === null) return ""
    return val.toString()
  }

  const lidarComMudanca = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") {
      onChange(null)
      return
    }

    const num = parseFloat(val.replace(',', '.'))
    if (!isNaN(num)) {
      if (num >= 0 && num <= 10) {
        onChange(num)
      }
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={formatarValor(value)}
      onChange={lidarComMudanca}
      className={cn("w-20 text-center font-bold", className)}
      disabled={disabled}
    />
  )
}

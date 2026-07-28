'use client'

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { arredondarNota } from "@/lib/utils/formatters"

interface InputNotaProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function InputNota({ value, onChange, placeholder = "0.0", className, disabled }: InputNotaProps) {
  const formatarValorInput = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return ""
    }
    return arredondarNota(Number(val), 1).toFixed(1)
  }

  const [localValue, setLocalValue] = useState<string>(formatarValorInput(value))

  useEffect(() => {
    setLocalValue(formatarValorInput(value))
  }, [value])

  const lidarComMudanca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value.replace(',', '.'))
  }

  const salvar = () => {
    if (localValue === "") {
      onChange(null)
      return
    }

    const num = parseFloat(localValue)
    if (!isNaN(num)) {
      if (num >= 0 && num <= 10) {
        const rounded_num = arredondarNota(num, 1)
        onChange(rounded_num)
        setLocalValue(rounded_num.toFixed(1))
      } else {
        setLocalValue(formatarValorInput(value))
      }
    } else {
      setLocalValue(formatarValorInput(value))
    }
  }

  const lidarComTecla = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      salvar()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={localValue}
      onChange={lidarComMudanca}
      onBlur={salvar}
      onKeyDown={lidarComTecla}
      className={cn("w-20 text-center font-bold px-1 text-xs sm:text-sm", className)}
      disabled={disabled}
    />
  )
}

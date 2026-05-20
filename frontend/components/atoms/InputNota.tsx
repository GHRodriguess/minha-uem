'use client'

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface InputNotaProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function InputNota({ value, onChange, placeholder = "0.00", className, disabled }: InputNotaProps) {
  const [localValue, setLocalValue] = useState<string>(value !== null ? value.toString() : "")

  useEffect(() => {
    setLocalValue(value !== null ? value.toString() : "")
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
        onChange(num)
      } else {
        setLocalValue(value !== null ? value.toString() : "")
      }
    } else {
      setLocalValue(value !== null ? value.toString() : "")
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
      className={cn("w-20 text-center font-bold", className)}
      disabled={disabled}
    />
  )
}

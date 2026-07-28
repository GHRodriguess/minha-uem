export function arredondarNota(value: number, decimal_places: number = 1): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0
  }
  const factor = Math.pow(10, decimal_places)
  return Math.floor(value * factor + 0.5 + Number.EPSILON) / factor
}

export function formatarNota(value: number | null | undefined, decimal_places: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }
  const rounded_value = arredondarNota(value, decimal_places)
  return rounded_value.toFixed(decimal_places)
}

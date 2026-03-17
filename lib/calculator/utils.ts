export function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1
  return 100 / Math.abs(american) + 1
}

export function decimalToAmerican(decimal: number): string {
  if (decimal <= 1) return 'N/A'
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`
  return `${Math.round(-100 / (decimal - 1))}`
}

export function noVigProbability(decimalOdds: number[]): number[] {
  const implied = decimalOdds.map(o => 1 / o)
  const total = implied.reduce((a, b) => a + b, 0)
  return implied.map(p => p / total)
}

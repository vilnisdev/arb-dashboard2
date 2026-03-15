export function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1
  return 100 / Math.abs(american) + 1
}

export function noVigProbability(decimalOdds: number[]): number[] {
  const implied = decimalOdds.map(o => 1 / o)
  const total = implied.reduce((a, b) => a + b, 0)
  return implied.map(p => p / total)
}

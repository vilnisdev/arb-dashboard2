'use client'
import { useState, useEffect, useCallback } from 'react'
import { BetTable } from '@/components/bets/BetTable'
import { Card, CardContent } from '@/components/ui/card'

interface Bet {
  id: string
  bookmaker: string
  event_name: string
  outcome: string
  odds: number
  stake: number
  status: string
  profit_loss?: number
  placed_at: string
  settled_at?: string
}

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/bets')
    setBets(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  function handleSettled(id: string, status: string, profitLoss: number) {
    setBets(prev => prev.map(b => b.id === id ? { ...b, status, profit_loss: profitLoss } : b))
  }

  const settled = bets.filter(b => b.status !== 'pending')
  const totalPnL = settled.reduce((sum, b) => sum + (b.profit_loss ?? 0), 0)
  const wins = settled.filter(b => b.status === 'won').length
  const losses = settled.filter(b => b.status === 'lost').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bet History</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total P&amp;L</p>
          <p className={`text-2xl font-bold tabular-nums ${totalPnL >= 0 ? 'text-win' : 'text-loss'}`}>
            {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
          </p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Wins</p>
          <p className="text-2xl font-bold text-win">{wins}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Losses</p>
          <p className="text-2xl font-bold text-loss">{losses}</p>
        </CardContent></Card>
      </div>
      <BetTable bets={bets} onSettled={handleSettled} />
    </div>
  )
}

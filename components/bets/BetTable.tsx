'use client'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  void: 'bg-gray-100 text-gray-800',
}

interface BetTableProps {
  bets: Bet[]
  onSettled: (id: string, status: string, profitLoss: number) => void
}

export function BetTable({ bets, onSettled }: BetTableProps) {
  const [settling, setSettling] = useState<string | null>(null)

  async function settle(bet: Bet, status: string) {
    setSettling(bet.id)
    const res = await fetch(`/api/bets/${bet.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, stake: bet.stake, odds: bet.odds }),
    })
    setSettling(null)
    if (!res.ok) { toast.error('Failed to settle bet'); return }
    const data = await res.json()
    onSettled(bet.id, status, data.profit_loss)
    toast.success(`Bet marked as ${status}`)
  }

  if (bets.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No bets logged yet.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Book</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Odds</TableHead>
          <TableHead>Stake</TableHead>
          <TableHead>P&amp;L</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bets.map(bet => (
          <TableRow key={bet.id}>
            <TableCell className="font-medium max-w-[200px] truncate">{bet.event_name}</TableCell>
            <TableCell className="capitalize">{bet.bookmaker}</TableCell>
            <TableCell>{bet.outcome}</TableCell>
            <TableCell>{parseFloat(bet.odds as unknown as string).toFixed(3)}</TableCell>
            <TableCell>${parseFloat(bet.stake as unknown as string).toFixed(2)}</TableCell>
            <TableCell className={bet.profit_loss != null ? (bet.profit_loss >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold') : ''}>
              {bet.profit_loss != null ? `${bet.profit_loss >= 0 ? '+' : ''}${parseFloat(bet.profit_loss as unknown as string).toFixed(2)}` : '—'}
            </TableCell>
            <TableCell>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[bet.status] ?? ''}`}>
                {bet.status}
              </span>
            </TableCell>
            <TableCell>
              {bet.status === 'pending' && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-green-600 h-7 text-xs" disabled={settling === bet.id} onClick={() => settle(bet, 'won')}>Won</Button>
                  <Button size="sm" variant="outline" className="text-red-600 h-7 text-xs" disabled={settling === bet.id} onClick={() => settle(bet, 'lost')}>Lost</Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const SPORTSBOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'pointsbet', 'barstool', 'betrivers', 'bet365', 'fanatics', 'espnbet']

interface PromoInitialData {
  type?: string
  sportsbook?: string
  amount?: number
  boost_percentage?: number
  max_bet?: number
  expires_at?: string
  notes?: string
  [key: string]: unknown
}

interface PromoFormProps {
  onSuccess: () => void
  initialData?: PromoInitialData
  promoId?: string
}

export function PromoForm({ onSuccess, initialData, promoId }: PromoFormProps) {
  const [type, setType] = useState<string>((initialData?.type as string) ?? 'free_bet')
  const [sportsbook, setSportsbook] = useState<string>((initialData?.sportsbook as string) ?? '')
  const [amount, setAmount] = useState<string>((initialData?.amount as number)?.toString() ?? '')
  const [boostPct, setBoostPct] = useState<string>((initialData?.boost_percentage as number)?.toString() ?? '')
  const [maxBet, setMaxBet] = useState<string>((initialData?.max_bet as number)?.toString() ?? '')
  const [expiresAt, setExpiresAt] = useState<string>((initialData?.expires_at as string) ?? '')
  const [notes, setNotes] = useState<string>((initialData?.notes as string) ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const body: Record<string, unknown> = {
      sportsbook, type, notes: notes || null,
      expires_at: expiresAt || null,
      max_bet: maxBet ? parseFloat(maxBet) : null,
    }
    if (type === 'free_bet' || type === 'no_sweat') body.amount = parseFloat(amount)
    if (type === 'profit_boost') body.boost_percentage = parseFloat(boostPct)

    const url = promoId ? `/api/promos/${promoId}` : '/api/promos'
    const method = promoId ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (!res.ok) { toast.error('Failed to save promo'); return }
    toast.success(promoId ? 'Promo updated' : 'Promo added')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sportsbook</Label>
          <Select value={sportsbook} onValueChange={(v) => setSportsbook(v ?? '')} required>
            <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
            <SelectContent>
              {SPORTSBOOKS.map(b => <SelectItem key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? 'free_bet')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free_bet">Free Bet</SelectItem>
              <SelectItem value="profit_boost">Profit Boost</SelectItem>
              <SelectItem value="no_sweat">No Sweat</SelectItem>
              <SelectItem value="odds_boost">Odds Boost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(type === 'free_bet' || type === 'no_sweat') && (
        <div className="space-y-2">
          <Label>Amount ($)</Label>
          <Input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
      )}
      {type === 'profit_boost' && (
        <div className="space-y-2">
          <Label>Boost Percentage (%)</Label>
          <Input type="number" min="0" max="1000" step="1" value={boostPct} onChange={e => setBoostPct(e.target.value)} required />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Bet ($, optional)</Label>
          <Input type="number" min="0" step="0.01" value={maxBet} onChange={e => setMaxBet(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Expires</Label>
          <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>

      <Button type="submit" disabled={loading || !sportsbook}>{loading ? 'Saving...' : promoId ? 'Update' : 'Add Promo'}</Button>
    </form>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Promo {
  id: string
  sportsbook: string
  type: string
  amount?: number
  boost_percentage?: number
  max_bet?: number
  expires_at?: string
  status: string
  notes?: string
}

function useCountdown(expiresAt?: string) {
  const [label, setLabel] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    if (!expiresAt) return
    function update() {
      const diff = new Date(expiresAt!).getTime() - Date.now()
      if (diff <= 0) { setLabel('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setIsUrgent(diff < 24 * 3600000)
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [expiresAt])

  return { label, isUrgent }
}

const TYPE_LABELS: Record<string, string> = {
  free_bet: 'Free Bet', profit_boost: 'Profit Boost', no_sweat: 'No Sweat', odds_boost: 'Odds Boost'
}

interface PromoCardProps {
  promo: Promo
  onEdit: (promo: Promo) => void
  onDeleted: (id: string) => void
}

export function PromoCard({ promo, onEdit, onDeleted }: PromoCardProps) {
  const { label: expiryLabel, isUrgent } = useCountdown(promo.expires_at)

  async function handleDelete() {
    await fetch(`/api/promos/${promo.id}`, { method: 'DELETE' })
    onDeleted(promo.id)
    toast.success('Promo deleted')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold capitalize">{promo.sportsbook}</p>
            <Badge variant="outline" className="mt-1">{TYPE_LABELS[promo.type] ?? promo.type}</Badge>
          </div>
          <div className="text-right">
            {promo.amount != null && <p className="text-xl font-bold">${promo.amount.toFixed(2)}</p>}
            {promo.boost_percentage != null && <p className="text-xl font-bold">{promo.boost_percentage}% Boost</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {expiryLabel && (
          <p className={`text-sm ${isUrgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
            {isUrgent && '🔴 '}Expires in {expiryLabel}
          </p>
        )}
        {promo.max_bet != null && <p className="text-sm text-muted-foreground">Max bet: ${promo.max_bet}</p>}
        {promo.notes && <p className="text-sm text-muted-foreground">{promo.notes}</p>}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(promo)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={handleDelete}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  )
}

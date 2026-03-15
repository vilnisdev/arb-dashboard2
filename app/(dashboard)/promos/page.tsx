'use client'
import { useState, useEffect, useCallback } from 'react'
import { PromoCard } from '@/components/promos/PromoCard'
import { PromoForm } from '@/components/promos/PromoForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [status, setStatus] = useState('available')
  const [showForm, setShowForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/promos')
    const data = await res.json()
    setPromos(data)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = promos.filter(p => p.status === status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Button onClick={() => { setEditingPromo(null); setShowForm(true) }}>+ Add Promo</Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="used">Used</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {status} promotions.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onEdit={p => { setEditingPromo(p); setShowForm(true) }}
              onDeleted={id => setPromos(prev => prev.filter(p => p.id !== id))}
            />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promo' : 'Add Promo'}</DialogTitle>
          </DialogHeader>
          <PromoForm
            onSuccess={() => { setShowForm(false); load() }}
            initialData={editingPromo ? { ...editingPromo } : undefined}
            promoId={editingPromo?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = await params

  // Auto-compute profit_loss on settlement
  let profitLoss = body.profit_loss
  if (body.status === 'won' && !profitLoss) {
    profitLoss = body.stake * (body.odds - 1)
  } else if (body.status === 'lost' && !profitLoss) {
    profitLoss = -body.stake
  }

  const { data, error } = await supabase
    .from('bets')
    .update({
      status: body.status,
      profit_loss: profitLoss,
      settled_at: body.status !== 'pending' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

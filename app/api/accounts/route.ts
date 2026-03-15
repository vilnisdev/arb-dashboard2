import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('sportsbook_accounts')
    .select('bookmaker_key, is_active')
    .eq('user_id', user.id)
    .order('bookmaker_key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accounts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookmaker_key, is_active } = await req.json()
  if (!bookmaker_key) return NextResponse.json({ error: 'bookmaker_key required' }, { status: 400 })

  const { error } = await supabase
    .from('sportsbook_accounts')
    .upsert(
      { user_id: user.id, bookmaker_key, is_active: is_active ?? true },
      { onConflict: 'user_id,bookmaker_key' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

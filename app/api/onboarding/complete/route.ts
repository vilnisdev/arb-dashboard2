import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { selectedBooks, selectedSports, defaultStake } = await req.json()

  if (selectedBooks?.length > 0) {
    const rows = selectedBooks.map((key: string) => ({
      user_id: user.id,
      bookmaker_key: key,
      is_active: true,
    }))
    const { error } = await supabase
      .from('sportsbook_accounts')
      .upsert(rows, { onConflict: 'user_id,bookmaker_key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    selected_sports: selectedSports?.length > 0 ? selectedSports : ['americanfootball_nfl', 'basketball_nba'],
    default_stake: parseFloat(defaultStake) || 100,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptApiKey } from '@/lib/crypto/apiKey'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey } = await request.json()
  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 })
  }

  // Validate the key works
  let requestsRemaining: number | null = null
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.status === 401) {
      return NextResponse.json({ error: 'invalid_api_key', message: 'API key rejected by The Odds API' }, { status: 400 })
    }
    requestsRemaining = parseInt(res.headers.get('x-requests-remaining') ?? '0', 10)
  } catch {
    return NextResponse.json({ error: 'validation_failed', message: 'Could not reach The Odds API to validate key' }, { status: 400 })
  }

  const { encrypted, iv, tag } = encryptApiKey(apiKey)

  await supabase.from('user_settings').upsert({
    user_id: user.id,
    odds_api_key_encrypted: encrypted,
    odds_api_key_iv: iv,
    odds_api_key_tag: tag,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, requestsRemaining, maskedKey: `****${apiKey.slice(-4)}` })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('user_settings').upsert({
    user_id: user.id,
    odds_api_key_encrypted: null,
    odds_api_key_iv: null,
    odds_api_key_tag: null,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}

import { createClient } from '@supabase/supabase-js'
import { decryptApiKey } from '@/lib/crypto/apiKey'
import { MissingApiKeyError } from './errors'

export async function getOddsApiKey(userId: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('user_settings')
    .select('odds_api_key_encrypted, odds_api_key_iv, odds_api_key_tag, subscription_tier')
    .eq('user_id', userId)
    .single()

  if (!data) throw new MissingApiKeyError(userId)

  if (data.subscription_tier === 'paid') {
    return process.env.PLATFORM_ODDS_API_KEY! // Phase 2
  }

  if (!data.odds_api_key_encrypted || !data.odds_api_key_iv || !data.odds_api_key_tag) {
    throw new MissingApiKeyError(userId)
  }

  return decryptApiKey({
    encrypted: data.odds_api_key_encrypted,
    iv: data.odds_api_key_iv,
    tag: data.odds_api_key_tag,
  })
}

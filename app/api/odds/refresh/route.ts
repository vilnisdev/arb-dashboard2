import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getOddsApiKey } from '@/lib/odds/getKey'
import { fetchOdds } from '@/lib/odds/client'
import { findOpportunities, buildFairProbabilityMap } from '@/lib/calculator'
import {
  MissingApiKeyError, OddsApiAuthError, OddsApiRateLimitError,
  OddsApiServerError, OddsApiFetchTimeoutError
} from '@/lib/odds/errors'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let apiKey: string
  try {
    apiKey = await getOddsApiKey(user.id)
  } catch (e) {
    if (e instanceof MissingApiKeyError) {
      return NextResponse.json({ error: 'no_api_key', message: 'Add your Odds API key in Settings' }, { status: 400 })
    }
    throw e
  }

  // Get user settings + sportsbook accounts in parallel
  const [settingsResult, accountsResult] = await Promise.all([
    supabase.from('user_settings').select('selected_sports, default_stake, min_roi_threshold').eq('user_id', user.id).single(),
    supabase.from('sportsbook_accounts').select('bookmaker_key').eq('user_id', user.id).eq('is_active', true),
  ])

  const settings = settingsResult.data
  const sports = settings?.selected_sports ?? ['americanfootball_nfl', 'basketball_nba']
  const defaultStake = settings?.default_stake ?? 100
  const minRoi = settings?.min_roi_threshold ?? 0
  const activeBooks = (accountsResult.data ?? []).map((a: { bookmaker_key: string }) => a.bookmaker_key)

  let oddsData: Awaited<ReturnType<typeof fetchOdds>>
  try {
    oddsData = await fetchOdds(apiKey, sports)
  } catch (e) {
    if (e instanceof OddsApiAuthError) {
      return NextResponse.json({ error: 'invalid_api_key', message: 'Your Odds API key is invalid' }, { status: 400 })
    }
    if (e instanceof OddsApiRateLimitError) {
      return NextResponse.json({ error: 'quota_exceeded', message: 'Monthly quota exceeded', resetDate: e.resetDate }, { status: 429 })
    }
    if (e instanceof OddsApiServerError) {
      return NextResponse.json({ error: 'odds_api_unavailable', message: 'The Odds API is temporarily unavailable' }, { status: 503 })
    }
    if (e instanceof OddsApiFetchTimeoutError) {
      return NextResponse.json({ error: 'odds_api_timeout', message: 'The Odds API timed out' }, { status: 503 })
    }
    throw e
  }

  const { events, requestsRemaining, requestsUsed } = oddsData

  // Flatten events into odds_cache rows
  const cacheRows = []
  for (const event of events) {
    for (const bookmaker of event.bookmakers) {
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes) {
          cacheRows.push({
            user_id: user.id,
            odds_api_event_id: event.id,
            sport_key: event.sport_key,
            sport_title: event.sport_title,
            commence_time: event.commence_time,
            home_team: event.home_team,
            away_team: event.away_team,
            bookmaker_key: bookmaker.key,
            market_key: market.key,
            outcome_name: outcome.name,
            price: outcome.price,
            point: outcome.point ?? null,
            fetched_at: new Date().toISOString(),
          })
        }
      }
    }
  }

  if (cacheRows.length > 0) {
    await serviceClient.from('odds_cache').upsert(cacheRows, {
      onConflict: 'user_id,odds_api_event_id,bookmaker_key,market_key,outcome_name'
    })
  }

  // Get active promos
  const { data: promos } = await supabase
    .from('promotions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'available')
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

  // Get fresh odds from cache
  const { data: cachedOdds } = await supabase
    .from('odds_cache')
    .select('*')
    .eq('user_id', user.id)
    .gt('commence_time', new Date().toISOString())

  const oddsRows = (cachedOdds ?? []).map((row: {
    bookmaker_key: string
    market_key: string
    outcome_name: string
    price: string | number
    point?: string | number | null
    odds_api_event_id: string
    sport_key: string
    home_team: string
    away_team: string
    commence_time: string
  }) => ({
    bookmaker_key: row.bookmaker_key,
    market_key: row.market_key,
    outcome_name: row.outcome_name,
    price: parseFloat(row.price as string),
    point: row.point ? parseFloat(row.point as string) : undefined,
    odds_api_event_id: row.odds_api_event_id,
    sport_key: row.sport_key,
    event_name: `${row.home_team} vs ${row.away_team}`,
    commence_time: row.commence_time,
  }))

  // Build fair probability map from all odds (including Pinnacle as reference)
  const fairProbMap = buildFairProbabilityMap(oddsRows)

  const opportunities = findOpportunities(promos ?? [], oddsRows, minRoi, defaultStake, fairProbMap, activeBooks)

  // Replace all opportunities for this user
  await serviceClient.from('opportunities').delete().eq('user_id', user.id)

  if (opportunities.length > 0) {
    const oppRows = opportunities.map(opp => ({
      user_id: user.id,
      promotion_id: opp.promotionId || null,
      opportunity_type: opp.opportunityType,
      sport_key: opp.sportKey,
      event_name: opp.eventName,
      commence_time: opp.commenceTime,
      leg1_bookmaker: opp.leg1.bookmaker,
      leg1_outcome: opp.leg1.outcome,
      leg1_odds: opp.leg1.odds,
      leg1_stake: opp.leg1.stake,
      leg2_bookmaker: opp.leg2?.bookmaker ?? null,
      leg2_outcome: opp.leg2?.outcome ?? null,
      leg2_odds: opp.leg2?.odds ?? null,
      leg2_stake: opp.leg2?.stake ?? null,
      guaranteed_profit: opp.guaranteedProfit,
      expected_value: opp.expectedValue,
      roi_percentage: opp.roiPercentage,
      calc_inputs: opp.calcInputs,
      is_active: true,
    }))
    await serviceClient.from('opportunities').insert(oppRows)
  }

  return NextResponse.json({
    opportunities,
    requestsRemaining,
    requestsUsed,
    fetchedAt: new Date().toISOString(),
  })
}

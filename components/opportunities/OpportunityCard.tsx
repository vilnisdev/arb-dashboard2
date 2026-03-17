'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getTypeAccent, getTypeBadge, getLegLabels } from '@/lib/opportunities/typeAccent'
import { decimalToAmerican } from '@/lib/calculator/utils'
import type { Opportunity } from './types'

const TYPE_LABELS: Record<string, string> = {
  free_bet_conversion: 'Free Bet',
  profit_boost_arb: 'Profit Boost',
  no_sweat_arb: 'No Sweat',
  true_arb: 'True Arb',
  free_bet_ev: '+EV Free Bet',
  boost_ev: '+EV Boost',
  odds_boost_ev: '+EV Odds Boost',
  line_value: '+EV Line',
}

const ARB_TYPES = new Set(['free_bet_conversion', 'profit_boost_arb', 'true_arb'])
const EV_TYPES = new Set(['free_bet_ev', 'boost_ev', 'odds_boost_ev', 'line_value', 'no_sweat_arb'])

function isArb(type: string) { return ARB_TYPES.has(type) }
function isEV(type: string) { return EV_TYPES.has(type) }

function getCountdown(commenceTime: string): string | null {
  const diff = new Date(commenceTime).getTime() - Date.now()
  if (isNaN(diff) || diff <= 0) return null
  if (diff > 24 * 60 * 60 * 1000) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  } catch {
    toast.error(`Copy failed — ${text}`)
  }
}

export function OpportunityCard({ opp, onLogBet }: { opp: Opportunity; onLogBet?: (opp: Opportunity) => void }) {
  const hasTwoLegs = !!opp.leg2_bookmaker
  const evType = isEV(opp.opportunity_type)
  const arbType = isArb(opp.opportunity_type)
  const legLabels = getLegLabels(opp.opportunity_type)
  const countdown = getCountdown(opp.commence_time)

  const typeAccent = getTypeAccent(opp.opportunity_type)
  const typeBadge = getTypeBadge(opp.opportunity_type)

  function copyLeg1() {
    const text = `${opp.leg1_bookmaker.toUpperCase()}: ${opp.leg1_outcome} @ ${decimalToAmerican(opp.leg1_odds)} — $${opp.leg1_stake.toFixed(2)}`
    copyText(text, opp.leg1_bookmaker.toUpperCase())
  }

  function copyLeg2() {
    if (!hasTwoLegs) return
    const text = `${opp.leg2_bookmaker!.toUpperCase()}: ${opp.leg2_outcome} @ ${decimalToAmerican(opp.leg2_odds!)} — $${opp.leg2_stake!.toFixed(2)}`
    copyText(text, opp.leg2_bookmaker!.toUpperCase())
  }

  function copySlip() {
    const lines = [
      `=== ${evType ? '+EV Play' : 'Arb'}: ${opp.event_name} ===`,
      `Type: ${TYPE_LABELS[opp.opportunity_type] ?? opp.opportunity_type}`,
      `ROI: ${opp.roi_percentage.toFixed(2)}%`,
      arbType && opp.guaranteed_profit != null ? `Guaranteed Profit: $${opp.guaranteed_profit.toFixed(2)}` : '',
      evType && opp.expected_value != null ? `Expected Value: $${opp.expected_value.toFixed(2)}` : '',
      '',
      `${hasTwoLegs ? 'STEP 1' : 'BET'}  ${opp.leg1_bookmaker.toUpperCase()}: ${opp.leg1_outcome} @ ${decimalToAmerican(opp.leg1_odds)} — $${opp.leg1_stake.toFixed(2)}`,
      hasTwoLegs ? `STEP 2  ${opp.leg2_bookmaker!.toUpperCase()}: ${opp.leg2_outcome} @ ${decimalToAmerican(opp.leg2_odds!)} — $${opp.leg2_stake!.toFixed(2)}` : '',
    ].filter(Boolean).join('\n')
    copyText(lines, 'Bet slip')
  }

  return (
    <Card className={`border-l-4 ${typeAccent} hover:scale-[1.01] transition-transform duration-150`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{opp.event_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(opp.commence_time).toLocaleDateString()} · {opp.sport_key.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Badge variant="outline">{TYPE_LABELS[opp.opportunity_type] ?? opp.opportunity_type}</Badge>
            <span className={`text-xs font-bold px-2 py-1 rounded-full tabular-nums ${typeBadge}`}>
              {opp.roi_percentage.toFixed(2)}% {evType ? 'EV' : 'ROI'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {arbType && opp.guaranteed_profit != null && (
          <p className="text-2xl font-bold tabular-nums text-win">+${opp.guaranteed_profit.toFixed(2)} guaranteed</p>
        )}
        {evType && opp.expected_value != null && (
          <p className="text-2xl font-bold tabular-nums text-ev">+${opp.expected_value.toFixed(2)} expected</p>
        )}

        {/* Leg 1 */}
        <div className="rounded-md bg-secondary p-3 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {hasTwoLegs ? 'Step 1' : 'Bet'}
              </span>
              <span className="text-sm font-semibold">{opp.leg1_bookmaker.toUpperCase()}</span>
            </div>
            {opp.promotions?.name && (
              <span className="text-xs text-muted-foreground">Using: {opp.promotions.name}</span>
            )}
          </div>
          <p className="font-medium">{opp.leg1_outcome}</p>
          <div className="flex items-center justify-between">
            <p className="text-sm tabular-nums text-muted-foreground">
              <strong className="text-foreground">{decimalToAmerican(opp.leg1_odds)}</strong>
              {' · '}
              <strong className="text-foreground">${opp.leg1_stake.toFixed(2)}</strong>
              {' · '}
              {legLabels.leg1}
            </p>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={copyLeg1}>
              Copy
            </Button>
          </div>
        </div>

        {/* Leg 2 */}
        {hasTwoLegs && (
          <div className="rounded-md bg-secondary p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Step 2</span>
                <span className="text-sm font-semibold">{opp.leg2_bookmaker!.toUpperCase()}</span>
              </div>
              {countdown && (
                <span className="text-xs text-amber-500 font-medium">{countdown} left</span>
              )}
            </div>
            <p className="font-medium">{opp.leg2_outcome}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm tabular-nums text-muted-foreground">
                <strong className="text-foreground">{decimalToAmerican(opp.leg2_odds!)}</strong>
                {' · '}
                <strong className="text-foreground">${opp.leg2_stake!.toFixed(2)}</strong>
                {' · '}
                {legLabels.leg2}
              </p>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={copyLeg2}>
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* For single-leg +EV: show countdown on the leg itself */}
        {!hasTwoLegs && countdown && (
          <p className="text-xs text-amber-500 font-medium">{countdown} left</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={copySlip}>
            {hasTwoLegs ? 'Copy Slip' : 'Copy Bet'}
          </Button>
          {onLogBet && (
            <Button size="sm" onClick={() => onLogBet(opp)}>Log Bet</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

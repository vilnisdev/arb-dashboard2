'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getTypeAccent, getTypeBadge } from '@/lib/opportunities/typeAccent'

interface Opportunity {
  id: string
  opportunity_type: string
  event_name: string
  commence_time: string
  sport_key: string
  leg1_bookmaker: string
  leg1_outcome: string
  leg1_odds: number
  leg1_stake: number
  leg2_bookmaker?: string | null
  leg2_outcome?: string | null
  leg2_odds?: number | null
  leg2_stake?: number | null
  guaranteed_profit?: number | null
  expected_value?: number | null
  roi_percentage: number
}

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

export function OpportunityCard({ opp, onLogBet }: { opp: Opportunity; onLogBet?: (opp: Opportunity) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasTwoLegs = !!opp.leg2_bookmaker
  const evType = isEV(opp.opportunity_type)
  const arbType = isArb(opp.opportunity_type)

  function copyBetSlip() {
    const lines = [
      `=== ${evType ? '+EV Play' : 'Arb'}: ${opp.event_name} ===`,
      `Type: ${TYPE_LABELS[opp.opportunity_type] ?? opp.opportunity_type}`,
      `ROI: ${opp.roi_percentage.toFixed(2)}%`,
      arbType && opp.guaranteed_profit != null ? `Guaranteed Profit: $${opp.guaranteed_profit.toFixed(2)}` : '',
      evType && opp.expected_value != null ? `Expected Value: $${opp.expected_value.toFixed(2)}` : '',
      '',
      `Leg 1: ${opp.leg1_bookmaker.toUpperCase()} — ${opp.leg1_outcome}`,
      `  Odds: ${opp.leg1_odds.toFixed(3)} | Stake: $${opp.leg1_stake.toFixed(2)}`,
      hasTwoLegs ? `\nLeg 2: ${opp.leg2_bookmaker!.toUpperCase()} — ${opp.leg2_outcome}` : '',
      hasTwoLegs ? `  Odds: ${opp.leg2_odds!.toFixed(3)} | Stake: $${opp.leg2_stake!.toFixed(2)}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(lines)
    toast.success('Bet slip copied!')
  }

  const typeAccent = getTypeAccent(opp.opportunity_type)
  const typeBadge = getTypeBadge(opp.opportunity_type)

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
          <div>
            <p className="text-2xl font-bold tabular-nums text-ev">+${opp.expected_value.toFixed(2)} expected</p>
            {!hasTwoLegs && (
              <p className="text-xs text-muted-foreground">
                {opp.leg1_bookmaker.toUpperCase()} · {opp.leg1_outcome} @ {opp.leg1_odds.toFixed(3)}
              </p>
            )}
          </div>
        )}

        {expanded && (
          <div className="space-y-2 text-sm border-t border-border pt-3">
            <div className={`grid gap-2 ${hasTwoLegs ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="bg-secondary rounded p-2">
                <p className="text-xs text-muted-foreground mb-1">Leg 1 — {opp.leg1_bookmaker.toUpperCase()}</p>
                <p className="font-medium">{opp.leg1_outcome}</p>
                <p className="tabular-nums">Odds: <strong>{opp.leg1_odds.toFixed(3)}</strong></p>
                <p className="tabular-nums">Stake: <strong>${opp.leg1_stake.toFixed(2)}</strong></p>
              </div>
              {hasTwoLegs && (
                <div className="bg-secondary rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">Leg 2 — {opp.leg2_bookmaker!.toUpperCase()}</p>
                  <p className="font-medium">{opp.leg2_outcome}</p>
                  <p className="tabular-nums">Odds: <strong>{opp.leg2_odds!.toFixed(3)}</strong></p>
                  <p className="tabular-nums">Stake: <strong>${opp.leg2_stake!.toFixed(2)}</strong></p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyBetSlip}>
                {hasTwoLegs ? 'Copy Slip' : 'Copy Bet'}
              </Button>
              {onLogBet && (
                <Button size="sm" onClick={() => onLogBet(opp)}>Log Bet</Button>
              )}
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Show Details'}
        </Button>
      </CardContent>
    </Card>
  )
}

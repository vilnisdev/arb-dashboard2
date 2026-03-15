'use client'
import { useState, useCallback } from 'react'
import { OpportunityCard } from './OpportunityCard'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

type FilterTab = 'all' | 'arb' | 'ev' | 'promo_ev'

const ARB_TYPES = new Set(['true_arb', 'free_bet_conversion', 'profit_boost_arb'])
const EV_TYPES = new Set(['line_value'])
const PROMO_EV_TYPES = new Set(['free_bet_ev', 'boost_ev', 'no_sweat_arb', 'odds_boost_ev'])

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'arb', label: 'Arb' },
  { key: 'ev', label: '+EV' },
  { key: 'promo_ev', label: 'Promo EV' },
]

function filterByTab(opps: Opportunity[], tab: FilterTab): Opportunity[] {
  if (tab === 'all') return opps
  if (tab === 'arb') return opps.filter(o => ARB_TYPES.has(o.opportunity_type))
  if (tab === 'ev') return opps.filter(o => EV_TYPES.has(o.opportunity_type))
  if (tab === 'promo_ev') return opps.filter(o => PROMO_EV_TYPES.has(o.opportunity_type))
  return opps
}

interface Props {
  initialOpportunities: Opportunity[]
}

export function OpportunityFeed({ initialOpportunities }: Props) {
  const [opportunities, setOpportunities] = useState(initialOpportunities)
  const [loading, setLoading] = useState(false)
  const [quota, setQuota] = useState<{ remaining: number; used: number } | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/odds/refresh', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'no_api_key') {
          toast.error('Add your Odds API key in Settings first')
        } else if (data.error === 'invalid_api_key') {
          toast.error('Your Odds API key is invalid — check Settings')
        } else if (data.error === 'quota_exceeded') {
          toast.error(`Quota exceeded. Resets: ${data.resetDate ?? 'unknown'}`)
        } else {
          toast.error(data.message ?? 'Refresh failed')
        }
        return
      }
      setOpportunities(data.opportunities ?? [])
      setQuota({ remaining: data.requestsRemaining, used: data.requestsUsed })
      setLastRefresh(new Date().toLocaleTimeString())
      toast.success(`Found ${data.opportunities?.length ?? 0} opportunities`)
    } catch {
      toast.error('Network error during refresh')
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = filterByTab(opportunities, activeTab)
  const counts = {
    all: opportunities.length,
    arb: opportunities.filter(o => ARB_TYPES.has(o.opportunity_type)).length,
    ev: opportunities.filter(o => EV_TYPES.has(o.opportunity_type)).length,
    promo_ev: opportunities.filter(o => PROMO_EV_TYPES.has(o.opportunity_type)).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Opportunities</h2>
          {quota && (
            <p className="text-sm text-muted-foreground">
              {quota.remaining} / {quota.remaining + quota.used} requests remaining this month
            </p>
          )}
          {lastRefresh && <p className="text-xs text-muted-foreground">Last updated: {lastRefresh}</p>}
        </div>
        <Button onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Odds'}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {activeTab === 'all' ? '' : activeTab.replace('_', ' ') + ' '}opportunities found.</p>
          <p className="text-sm mt-1">
            {opportunities.length === 0
              ? 'Add promos and click Refresh Odds to find arbs.'
              : 'Try a different filter tab.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(opp => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </div>
  )
}

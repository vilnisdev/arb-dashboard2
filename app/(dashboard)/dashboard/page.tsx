import { createClient } from '@/lib/supabase/server'
import { OpportunityFeed } from '@/components/opportunities/OpportunityFeed'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: opportunities }, { data: bets }] = await Promise.all([
    supabase.from('opportunities').select('*, promotions(name, amount)').eq('user_id', user!.id).eq('is_active', true).order('roi_percentage', { ascending: false }),
    supabase.from('bets').select('profit_loss, status').eq('user_id', user!.id).in('status', ['won', 'lost']),
  ])

  const lifetimeProfit = (bets ?? []).reduce((sum: number, b: { profit_loss?: number | null; status: string }) => sum + (b.profit_loss ?? 0), 0)

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Lifetime Profit</p>
        <p className={`text-5xl font-bold tabular-nums ${lifetimeProfit >= 0 ? 'text-win' : 'text-loss'}`}>
          {lifetimeProfit >= 0 ? '+' : '-'}${Math.abs(lifetimeProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Based on {(bets ?? []).length} settled bets</p>
      </div>

      <OpportunityFeed initialOpportunities={(opportunities ?? []) as Parameters<typeof OpportunityFeed>[0]['initialOpportunities']} />
    </div>
  )
}

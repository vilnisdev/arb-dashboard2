'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { SPORTS } from '@/lib/sports'

const SPORTSBOOKS = [
  { key: 'draftkings', label: 'DraftKings' },
  { key: 'fanduel', label: 'FanDuel' },
  { key: 'betmgm', label: 'BetMGM' },
  { key: 'caesars', label: 'Caesars' },
  { key: 'pointsbet', label: 'PointsBet' },
  { key: 'williamhill_us', label: 'Caesars (WH)' },
  { key: 'barstool', label: 'Barstool' },
  { key: 'bet365', label: 'Bet365' },
  { key: 'espnbet', label: 'ESPN Bet' },
  { key: 'hardrockbet', label: 'Hard Rock Bet' },
  { key: 'betrivers', label: 'BetRivers' },
  { key: 'fanatics', label: 'Fanatics' },
]

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [maskedKey, setMaskedKey] = useState<string | null>(null)
  const [keyLoading, setKeyLoading] = useState(false)
  const [selectedSports, setSelectedSports] = useState<string[]>(['americanfootball_nfl', 'basketball_nba'])
  const [defaultStake, setDefaultStake] = useState('100')
  const [minRoi, setMinRoi] = useState('0')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [activeBooks, setActiveBooks] = useState<string[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [settingsRes, accountsRes] = await Promise.all([
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        fetch('/api/accounts'),
      ])

      if (settingsRes.data) {
        setSelectedSports(settingsRes.data.selected_sports ?? ['americanfootball_nfl', 'basketball_nba'])
        setDefaultStake(settingsRes.data.default_stake?.toString() ?? '100')
        setMinRoi(settingsRes.data.min_roi_threshold?.toString() ?? '0')
        if (settingsRes.data.odds_api_key_encrypted) setMaskedKey('****saved')
      }

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setActiveBooks((data.accounts ?? []).filter((a: { is_active: boolean }) => a.is_active).map((a: { bookmaker_key: string }) => a.bookmaker_key))
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveApiKey(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey) return
    setKeyLoading(true)
    const res = await fetch('/api/settings/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    })
    setKeyLoading(false)
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.message ?? 'Failed to save API key')
      return
    }
    setMaskedKey(data.maskedKey)
    setApiKey('')
    toast.success(`API key saved. ${data.requestsRemaining} requests remaining this month.`)
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        selected_sports: selectedSports,
        default_stake: parseFloat(defaultStake),
        min_roi_threshold: parseFloat(minRoi),
        updated_at: new Date().toISOString(),
      })
    }
    setSettingsLoading(false)
    toast.success('Settings saved')
  }

  async function toggleBook(key: string) {
    const isActive = activeBooks.includes(key)
    const newActiveBooks = isActive ? activeBooks.filter(b => b !== key) : [...activeBooks, key]
    setActiveBooks(newActiveBooks)
    setBooksLoading(true)
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmaker_key: key, is_active: !isActive }),
    })
    setBooksLoading(false)
    if (!res.ok) {
      setActiveBooks(activeBooks) // revert on error
      toast.error('Failed to update sportsbook accounts')
    }
  }

  function toggleSport(key: string) {
    setSelectedSports(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Odds API Key</CardTitle>
          <CardDescription>
            Get a free key at <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer" className="underline">the-odds-api.com</a> (500 requests/month free).
            Your key is stored encrypted and never exposed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveApiKey} className="space-y-4">
            {maskedKey && (
              <p className="text-sm text-muted-foreground">Current key: <code>{maskedKey}</code></p>
            )}
            <div className="space-y-2">
              <Label>New API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Paste your Odds API key"
              />
            </div>
            <Button type="submit" disabled={keyLoading || !apiKey}>
              {keyLoading ? 'Validating...' : maskedKey ? 'Update Key' : 'Save Key'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Your Sportsbook Accounts</CardTitle>
          <CardDescription>
            Check the books where you have active accounts. Only opportunities from these books will be shown.
            Leave all unchecked to see opportunities from all books.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {SPORTSBOOKS.map(book => (
              <div key={book.key} className="flex items-center gap-2">
                <Checkbox
                  id={`book-${book.key}`}
                  checked={activeBooks.includes(book.key)}
                  onCheckedChange={() => toggleBook(book.key)}
                  disabled={booksLoading}
                />
                <Label htmlFor={`book-${book.key}`} className="font-normal cursor-pointer">{book.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <form onSubmit={saveSettings} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sports</CardTitle>
            <CardDescription>Select which sports to fetch odds for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {SPORTS.map(sport => (
                <div key={sport.key} className="flex items-center gap-2">
                  <Checkbox
                    id={sport.key}
                    checked={selectedSports.includes(sport.key)}
                    onCheckedChange={() => toggleSport(sport.key)}
                  />
                  <Label htmlFor={sport.key} className="font-normal cursor-pointer">{sport.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculator Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stake">Default Stake ($)</Label>
              <Input id="stake" type="number" min="1" step="1" value={defaultStake} onChange={e => setDefaultStake(e.target.value)} className="max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roi">Minimum ROI Threshold (%)</Label>
              <Input id="roi" type="number" min="0" step="0.1" value={minRoi} onChange={e => setMinRoi(e.target.value)} className="max-w-xs" />
              <p className="text-xs text-muted-foreground">Set to 0 to show all opportunities</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={settingsLoading}>
          {settingsLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [selectedSports, setSelectedSports] = useState<string[]>(['americanfootball_nfl', 'basketball_nba'])
  const [defaultStake, setDefaultStake] = useState('100')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function toggleBook(key: string) {
    setSelectedBooks(prev => prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key])
  }

  function toggleSport(key: string) {
    setSelectedSports(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])
  }

  async function complete() {
    setLoading(true)
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedBooks, selectedSports, defaultStake }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Failed to save settings. Please try again.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Set up your account</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3 — you can change these anytime in Settings.</p>
        </div>

        <div className="flex gap-1.5">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Sportsbooks</CardTitle>
              <CardDescription>
                Select the books where you have active accounts. Only opportunities from selected books will be shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {SPORTSBOOKS.map(book => (
                  <div key={book.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`book-${book.key}`}
                      checked={selectedBooks.includes(book.key)}
                      onCheckedChange={() => toggleBook(book.key)}
                    />
                    <Label htmlFor={`book-${book.key}`} className="font-normal cursor-pointer">{book.label}</Label>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Sports</CardTitle>
              <CardDescription>Select which sports to fetch odds for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Default Stake</CardTitle>
              <CardDescription>Set your default bet amount for the arbitrage calculator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stake">Default Stake ($)</Label>
                <Input
                  id="stake"
                  type="number"
                  min="1"
                  step="1"
                  value={defaultStake}
                  onChange={e => setDefaultStake(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={complete} disabled={loading}>
                  {loading ? 'Saving...' : 'Go to Dashboard'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

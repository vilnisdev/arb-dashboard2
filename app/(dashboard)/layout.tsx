import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">ArbDash</span>
          <div className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/promos" className="hover:underline">Promos</Link>
            <Link href="/bets" className="hover:underline">Bets</Link>
            <Link href="/settings" className="hover:underline">Settings</Link>
          </div>
        </div>
        <form action="/api/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit">Sign out</Button>
        </form>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/promos', label: 'Promos' },
  { href: '/bets', label: 'Bets' },
  { href: '/settings', label: 'Settings' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg tracking-tight">
          Arb<span className="text-primary">·</span>Dash
        </span>
        <div className="flex gap-5 text-sm">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground transition-colors'
                }
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
      <form action="/api/auth/signout" method="post">
        <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
          Sign out
        </Button>
      </form>
    </nav>
  )
}

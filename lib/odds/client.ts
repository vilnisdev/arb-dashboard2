import { OddsApiEvent } from './types'
import {
  OddsApiAuthError, OddsApiRateLimitError, OddsApiServerError,
  OddsApiFetchTimeoutError, OddsApiParseError
} from './errors'

export async function fetchOdds(apiKey: string, sports: string[]): Promise<{
  events: OddsApiEvent[]
  requestsRemaining: number
  requestsUsed: number
}> {
  const results: OddsApiEvent[] = []
  let requestsRemaining = 0
  let requestsUsed = 0

  for (const sport of sports) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let res: Response
    try {
      res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us,eu&markets=h2h,spreads,totals&oddsFormat=decimal`,
        { signal: controller.signal }
      )
    } catch (e: unknown) {
      clearTimeout(timeout)
      if (e instanceof Error && e.name === 'AbortError') throw new OddsApiFetchTimeoutError()
      throw e
    }
    clearTimeout(timeout)

    if (res.status === 401) throw new OddsApiAuthError()
    if (res.status === 429) {
      const resetDate = res.headers.get('x-requests-reset') ?? undefined
      throw new OddsApiRateLimitError(resetDate)
    }
    if (res.status >= 500) throw new OddsApiServerError()

    requestsRemaining = parseInt(res.headers.get('x-requests-remaining') ?? '0', 10)
    requestsUsed = parseInt(res.headers.get('x-requests-used') ?? '0', 10)

    let data: OddsApiEvent[]
    try {
      data = await res.json()
    } catch {
      throw new OddsApiParseError()
    }

    results.push(...data)
  }

  return { events: results, requestsRemaining, requestsUsed }
}

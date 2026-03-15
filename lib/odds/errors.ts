export class MissingApiKeyError extends Error {
  constructor(userId: string) {
    super(`No Odds API key configured for user ${userId}`)
    this.name = 'MissingApiKeyError'
  }
}
export class OddsApiAuthError extends Error {
  constructor() { super('Invalid Odds API key'); this.name = 'OddsApiAuthError' }
}
export class OddsApiRateLimitError extends Error {
  resetDate?: string
  constructor(resetDate?: string) {
    super('Odds API quota exceeded')
    this.name = 'OddsApiRateLimitError'
    this.resetDate = resetDate
  }
}
export class OddsApiServerError extends Error {
  constructor() { super('Odds API server error'); this.name = 'OddsApiServerError' }
}
export class OddsApiFetchTimeoutError extends Error {
  constructor() { super('Odds API request timed out'); this.name = 'OddsApiFetchTimeoutError' }
}
export class OddsApiParseError extends Error {
  constructor() { super('Failed to parse Odds API response'); this.name = 'OddsApiParseError' }
}

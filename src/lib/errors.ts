const SAFE_MESSAGES = new Set([
  'Something went wrong. Please try again.',
  'Something went wrong',
  'Unauthorized',
  'Set not found',
  'Invalid URL',
  'Import failed',
  'Failed to create set',
  'No valid term/definition pairs found',
  'Import failed. Please try again.',
  'Add at least one complete card',
  'Title is required',
  'Paste your notes first',
  'API key required. Calls go from your browser to the provider.',
  'Generation failed. Check your API key.',
  'OpenAI request failed',
  'Anthropic request failed',
])

const INTERNAL_PATTERN =
  /failed query|econnrefused|econnreset|etimedout|password authentication|too many connections|ssl|postgres|drizzle|select |insert |update |delete |from "|where |params:|stack|at eval|node_modules|database_url|auth_secret|enotfound|getaddrinfo/i

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message
    if (typeof m === 'string') return m
  }
  return ''
}

export function isSafeUserMessage(message: string): boolean {
  const msg = message.trim()
  if (!msg || msg.length > 160) return false
  if (INTERNAL_PATTERN.test(msg)) return false
  if (SAFE_MESSAGES.has(msg)) return true
  if (msg.length <= 100 && !/[`{}<>]|\$\d/.test(msg) && !/\n/.test(msg)) {
    return /password|email|name|required|invalid|must |at least|too many|already|try again|not found|unauthorized/i.test(
      msg,
    )
  }
  return false
}

export function toUserMessage(err: unknown, fallback: string): string {
  const msg = extractMessage(err).trim()
  if (msg && isSafeUserMessage(msg)) return msg
  return fallback
}

export function throwUserError(err: unknown, fallback: string): never {
  const msg = extractMessage(err).trim()
  if (msg && isSafeUserMessage(msg)) {
    throw new Error(msg)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error('[openlet]', err)
  }
  throw new Error(fallback)
}

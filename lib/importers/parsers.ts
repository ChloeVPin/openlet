export function stripBOM(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1)
  return text
}

export function parseCSV(text: string): { term: string; definition: string }[] {
  const pairs: { term: string; definition: string }[] = []
  const lines = stripBOM(text).trim().split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = parseCSVLine(trimmed)
    if (parts.length >= 2) {
      pairs.push({ term: parts[0].trim(), definition: parts[1].trim() })
    } else if (parts.length === 1 && parts[0].trim()) {
      pairs.push({ term: parts[0].trim(), definition: '' })
    }
  }

  return pairs
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)

  return result
}

export function parseMarkdown(text: string): { term: string; definition: string }[] {
  const pairs: { term: string; definition: string }[] = []
  const lines = text.trim().split('\n')

  let currentTerm = ''
  let currentDef = ''
  let inDefinition = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentTerm) {
        pairs.push({ term: currentTerm, definition: currentDef.trim() })
        currentDef = ''
      }
      currentTerm = trimmed.replace(/^[-*]\s+/, '').trim()
      inDefinition = false
    } else if (trimmed.startsWith('  - ') || trimmed.startsWith('  * ')) {
      inDefinition = true
      currentDef += (currentDef ? ' ' : '') + trimmed.replace(/^\s{2}[-*]\s+/, '').trim()
    } else if (trimmed.includes('|')) {
      const parts = trimmed
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
      if (parts.length >= 2 && !parts[0].includes('---')) {
        pairs.push({ term: parts[0], definition: parts[1] })
      }
    } else if (trimmed.includes('\t')) {
      const parts = trimmed
        .split('\t')
        .map((s) => s.trim())
        .filter(Boolean)
      if (parts.length >= 2) {
        pairs.push({ term: parts[0], definition: parts[1] })
      }
    }
  }

  if (currentTerm) {
    pairs.push({ term: currentTerm, definition: currentDef.trim() })
  }

  return pairs
}

export function exportToCSV(pairs: { term: string; definition: string }[]): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
  return pairs.map((p) => `${escape(p.term)},${escape(p.definition)}`).join('\n')
}

export function exportToJSON(pairs: { term: string; definition: string }[]): string {
  return JSON.stringify(pairs, null, 2)
}

import type { OPGStructure } from './types'

export function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0142/g, 'l')
    .replace(/\s+/g, ' ')
}

export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from<number>({ length: n + 1 }).fill(0),
  )

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }

  return dp[m][n]
}

export interface FuzzyMatchResult {
  isCorrect: boolean
  isClose: boolean
  normalizedInput: string
  matchedName: string | null
  confidence: number
  correctedTypo: boolean
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

function tokenMatchRatio(inputTokens: string[], targetTokens: string[]): number {
  if (targetTokens.length === 0) return inputTokens.length === 0 ? 1 : 0

  let matched = 0
  const used = new Set<number>()

  for (const inputToken of inputTokens) {
    for (let j = 0; j < targetTokens.length; j++) {
      if (used.has(j)) continue
      if (levenshtein(inputToken, targetTokens[j]) <= 1) {
        matched++
        used.add(j)
        break
      }
    }
  }

  return matched / targetTokens.length
}

export function fuzzyMatchStructure(
  input: string,
  target: OPGStructure,
): FuzzyMatchResult {
  const normalizedInput = normalizePolish(input)
  const targetNorm = normalizePolish(target.name_pl_normalized)

  const base: FuzzyMatchResult = {
    isCorrect: false,
    isClose: false,
    normalizedInput,
    matchedName: null,
    confidence: 0,
    correctedTypo: false,
  }

  // (a) Exact match on name_pl_normalized
  if (normalizedInput === targetNorm) {
    return { ...base, isCorrect: true, matchedName: target.name_pl, confidence: 1 }
  }

  // (b) Exact match on any accepted alias
  for (const alias of target.accepted_aliases) {
    if (normalizedInput === normalizePolish(alias)) {
      return { ...base, isCorrect: true, matchedName: alias, confidence: 1 }
    }
  }

  const allNames = [targetNorm, ...target.accepted_aliases.map(normalizePolish)]

  let bestRatio = 0
  let bestName = target.name_pl

  for (const name of allNames) {
    const dist = levenshtein(normalizedInput, name)
    const ratio = similarityRatio(normalizedInput, name)

    if (ratio > bestRatio) {
      bestRatio = ratio
      bestName = name === targetNorm ? target.name_pl : name
    }

    // (c) Levenshtein distance <= 1
    if (dist <= 1) {
      return {
        ...base,
        isCorrect: true,
        matchedName: bestName,
        confidence: ratio,
        correctedTypo: true,
      }
    }
  }

  // (d) Similarity ratio >= 0.80
  if (bestRatio >= 0.8) {
    return {
      ...base,
      isCorrect: true,
      matchedName: bestName,
      confidence: bestRatio,
      correctedTypo: true,
    }
  }

  // (e) Token-level match
  const inputTokens = normalizedInput.split(' ').filter(Boolean)
  let bestTokenRatio = 0

  for (const name of allNames) {
    const targetTokens = name.split(' ').filter(Boolean)
    const ratio = tokenMatchRatio(inputTokens, targetTokens)
    if (ratio > bestTokenRatio) bestTokenRatio = ratio
  }

  if (bestTokenRatio >= 0.8) {
    return {
      ...base,
      isCorrect: true,
      matchedName: bestName,
      confidence: bestTokenRatio,
      correctedTypo: true,
    }
  }

  // (f) Close match — second chance
  if (bestRatio >= 0.65 || bestTokenRatio >= 0.6) {
    return {
      ...base,
      isClose: true,
      matchedName: bestName,
      confidence: Math.max(bestRatio, bestTokenRatio),
    }
  }

  // (g) Incorrect
  return { ...base, confidence: Math.max(bestRatio, bestTokenRatio) }
}

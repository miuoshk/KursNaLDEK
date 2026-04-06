#!/usr/bin/env node

/**
 * Konwerter pytań z formatu TypeScript (.ts) do SQL (Supabase)
 *
 * Użycie:
 *   node ts-to-sql.mjs input.ts output.sql
 *   node ts-to-sql.mjs input.ts                  # wypisuje na stdout
 *   node ts-to-sql.mjs input.ts output.sql --topic-map
 *
 * Format wejściowy (.ts):
 *   Tablica obiektów z polami: id, text, options[], correctOptionId, explanation, topic
 *
 * Format wyjściowy (.sql):
 *   INSERT INTO questions (...) VALUES (...);
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// ============================================
// KONFIGURACJA — dostosuj do swoich danych
// ============================================

// Mapowanie starych topic ID (Valkyria) → nowe topic ID (Supabase)
// Dodaj swoje mapowania tutaj:
const TOPIC_MAP = {
  // Biochemia
  'S1-BIO': 'BIO-AA',
  'S2-ENZ': 'BIO-ENZ',
  'S3-MET': 'BIO-MET',
  'S4-ETC': 'BIO-ETC',
  'S5-LIP': 'BIO-LIP',
  'S6-NK': 'BIO-NK',

  // Anatomia
  'A1-CZA': 'ANA-CZA',
  'A2-MIE': 'ANA-MIE',
  'A3-NAC': 'ANA-NAC',
  'A4-NER': 'ANA-NER',
  'A5-JAM': 'ANA-JAM',

  // Dodaj kolejne mapowania w miarę potrzeb...
  // 'STARY-ID': 'NOWY-ID',
}

// Domyślna trudność jeśli brak w źródle
const DEFAULT_DIFFICULTY = 'srednie'

// ============================================
// PARSOWANIE
// ============================================

function extractQuestionsFromTS(content) {
  // Strategia: znajdź wszystkie obiekty pytań w pliku .ts
  // Obsługuje formaty:
  //   export const questions = [...]
  //   const questions: Question[] = [...]
  //   export default [...]
  //   [{...}, {...}]

  // Usuń TypeScript-specific syntax
  let cleaned = content
    // Usuń type annotations
    .replace(/:\s*(Question|QuestionData|any)\[\]/g, '')
    .replace(/as\s+const/g, '')
    // Usuń export/const declarations — zostaw sam array
    .replace(/export\s+(default\s+)?/g, '')
    .replace(/const\s+\w+\s*=\s*/g, '')
    // Template literals → zwykłe stringi
    .replace(/`([^`]*)`/gs, (_, inner) => {
      // Zamień template literal na single-quote string
      const escaped = inner
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "''")
        .replace(/\n/g, '\\n')
        .replace(/\$\{[^}]+\}/g, '') // usuń ${} expressions
      return `'${escaped}'`
    })

  // Próbuj sparsować jako JSON-like
  // Zamień single quotes na double quotes (ale nie wewnątrz stringów)
  // To jest uproszczone — dla złożonych przypadków użyj eval

  try {
    // Podejście 1: eval (działa dla większości formatów .ts)
    const fn = new Function(`return ${cleaned}`)
    return fn()
  } catch (e) {
    // Podejście 2: regex extraction
    console.error('Nie udało się sparsować pliku automatycznie.')
    console.error('Błąd:', e.message)
    console.error('')
    console.error('Spróbuj wyeksportować pytania jako JSON:')
    console.error('  W pliku .ts dodaj na końcu:')
    console.error('  console.log(JSON.stringify(questions, null, 2))')
    console.error('  Uruchom: npx tsx plik.ts > pytania.json')
    console.error('  Potem: node ts-to-sql.mjs pytania.json output.sql')
    process.exit(1)
  }
}

// ============================================
// CZYSZCZENIE TEKSTU
// ============================================

function cleanExplanation(text) {
  if (!text) return ''

  return text
    // Usuń emoji
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // emotikony
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // symbole
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // transport
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')  // flagi
    .replace(/[\u{2600}-\u{26FF}]/gu, '')    // misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')    // dingbats
    .replace(/[❌⚠️🔑💡🔥✅❓⭐🧬🔬💊🩺📖📝✨🎯]/g, '')

    // Zamień markdown tabele na tekst
    .replace(/\|[^\n]+\|/g, (match) => {
      // Pomiń linie separatorów (|---|---|)
      if (/^[\s|:-]+$/.test(match)) return ''
      // Zamień | na spacje
      return match.replace(/\|/g, ' ').trim()
    })

    // Zamień markdown formatowanie na czysty tekst
    .replace(/\*\*([^*]+)\*\*/g, '$1')      // **bold** → bold
    .replace(/\*([^*]+)\*/g, '$1')           // *italic* → italic
    .replace(/```[^`]*```/gs, (match) => {   // ```code blocks``` → tekst
      return match.replace(/```\w*\n?/g, '').trim()
    })
    .replace(/`([^`]+)`/g, '$1')             // `inline code` → tekst

    // Wyczyść wielokrotne spacje i puste linie
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function escapeSQL(text) {
  if (!text) return ''
  return text.replace(/'/g, "''")
}

// ============================================
// GENEROWANIE SQL
// ============================================

function questionToSQL(q, index) {
  // Mapuj topic ID
  const topicId = TOPIC_MAP[q.topic] || q.topic_id || q.topicId || q.topic
  if (!topicId) {
    console.warn(`⚠️  Pytanie ${q.id}: brak topic ID, pomijam`)
    return null
  }

  // ID pytania
  const id = q.id || `q-${String(index + 1).padStart(3, '0')}`

  // Tekst pytania
  const text = escapeSQL(q.text || q.question || '')
  if (!text) {
    console.warn(`⚠️  Pytanie ${id}: brak tekstu, pomijam`)
    return null
  }

  // Opcje odpowiedzi
  const options = (q.options || []).map(opt => ({
    id: opt.id || opt.letter || '',
    text: opt.text || opt.content || opt.label || '',
  }))

  if (options.length === 0) {
    console.warn(`⚠️  Pytanie ${id}: brak opcji odpowiedzi, pomijam`)
    return null
  }

  const optionsJSON = JSON.stringify(options).replace(/'/g, "''")

  // Poprawna odpowiedź
  const correctId = q.correctOptionId || q.correct_option_id || q.correct || q.answer || ''

  // Wyjaśnienie
  const explanation = escapeSQL(cleanExplanation(q.explanation || q.rationale || ''))

  // Trudność
  const difficulty = q.difficulty || DEFAULT_DIFFICULTY

  // Źródło egzaminu
  const sourceExam = q.source_exam || q.sourceExam || q.exam || null
  const sourceCode = q.source_code || q.sourceCode || q.code || null

  return `('${escapeSQL(id)}', '${escapeSQL(topicId)}',
 '${text}',
 '${optionsJSON}',
 '${escapeSQL(correctId)}',
 '${explanation}',
 '${difficulty}',
 ${sourceExam ? `'${escapeSQL(sourceExam)}'` : 'NULL'},
 ${sourceCode ? `'${escapeSQL(sourceCode)}'` : 'NULL'})`
}

function generateSQL(questions) {
  const header = `-- ============================================
-- Pytania wygenerowane ze skryptu ts-to-sql
-- Data: ${new Date().toISOString().split('T')[0]}
-- Liczba pytań: ${questions.length}
-- ============================================

`

  // Filtruj pytania bez błędów
  const sqlValues = questions
    .map((q, i) => questionToSQL(q, i))
    .filter(Boolean)

  if (sqlValues.length === 0) {
    console.error('❌ Żadne pytanie nie przeszło walidacji!')
    process.exit(1)
  }

  const insertStatement = `INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty, source_exam, source_code) VALUES

${sqlValues.join(',\n\n')};`

  // Aktualizacja liczników
  const topicIds = [...new Set(questions.map(q => TOPIC_MAP[q.topic] || q.topic_id || q.topicId || q.topic).filter(Boolean))]
  const updateCounters = topicIds.map(tid =>
    `UPDATE topics SET question_count = (SELECT COUNT(*) FROM questions WHERE topic_id = '${tid}') WHERE id = '${tid}';`
  ).join('\n')

  return `${header}${insertStatement}

-- Aktualizacja liczników pytań w tematach:
${updateCounters}

-- Gotowe! Wklejone ${sqlValues.length} pytań.
`
}

// ============================================
// MAIN
// ============================================

const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
Konwerter pytań TS/JSON → SQL (Supabase)

Użycie:
  node ts-to-sql.mjs plik_z_pytaniami.ts [output.sql]
  node ts-to-sql.mjs pytania.json [output.sql]

Jeśli nie podasz output — wypisze SQL na stdout.

Obsługiwane formaty wejściowe:
  .ts   — TypeScript z tablicą pytań (export const questions = [...])
  .json — JSON array z pytaniami

Konfiguracja:
  Edytuj TOPIC_MAP na górze pliku żeby zmapować stare ID tematów na nowe.
`)
  process.exit(0)
}

const inputPath = resolve(args[0])
const outputPath = args[1] ? resolve(args[1]) : null

console.log(`📂 Wczytuję: ${inputPath}`)

const raw = readFileSync(inputPath, 'utf-8')

let questions

if (inputPath.endsWith('.json')) {
  questions = JSON.parse(raw)
} else {
  questions = extractQuestionsFromTS(raw)
}

if (!Array.isArray(questions)) {
  console.error('❌ Plik nie zawiera tablicy pytań!')
  process.exit(1)
}

console.log(`📋 Znaleziono ${questions.length} pytań`)

const sql = generateSQL(questions)

if (outputPath) {
  writeFileSync(outputPath, sql, 'utf-8')
  console.log(`✅ Zapisano SQL do: ${outputPath}`)
} else {
  console.log('\n--- SQL OUTPUT ---\n')
  console.log(sql)
}

// Podsumowanie
const mapped = questions.filter(q => TOPIC_MAP[q.topic]).length
const unmapped = questions.filter(q => q.topic && !TOPIC_MAP[q.topic]).length

if (unmapped > 0) {
  console.warn(`\n⚠️  ${unmapped} pytań ma niezmapowane topic ID:`)
  const unknownTopics = [...new Set(questions.filter(q => q.topic && !TOPIC_MAP[q.topic]).map(q => q.topic))]
  unknownTopics.forEach(t => console.warn(`   - "${t}" → dodaj do TOPIC_MAP`))
}

console.log(`\n📊 Podsumowanie:`)
console.log(`   Zmapowane: ${mapped}`)
console.log(`   Niezmapowane: ${unmapped}`)
console.log(`   Wygenerowane SQL: ${questions.length - unmapped} pytań`)

import type { OPGQuizConfig, OPGQuestion, OPGStructure } from './types'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickDistractors(
  target: OPGStructure,
  allStructures: OPGStructure[],
): OPGStructure[] {
  const others = allStructures.filter((s) => s.id !== target.id)

  const sameRegion =
    target.region !== null
      ? shuffle(others.filter((s) => s.region === target.region))
      : []
  const rest = shuffle(
    others.filter((s) => !sameRegion.includes(s)),
  )

  const pool = [...sameRegion, ...rest]
  return pool.slice(0, 3)
}

export function generateOPGQuestions(
  config: OPGQuizConfig,
  structures: OPGStructure[],
): OPGQuestion[] {
  const shuffled = shuffle(structures)
  const selected = shuffled.slice(0, config.count)

  return selected.map((target) => {
    const direction: OPGQuestion['direction'] =
      config.direction === 'mix'
        ? Math.random() < 0.5
          ? 'number_to_name'
          : 'name_to_number'
        : config.direction

    const question: OPGQuestion = {
      id: crypto.randomUUID(),
      targetStructure: target,
      direction,
      mode: config.mode,
    }

    if (config.mode === 'mcq') {
      question.distractors = pickDistractors(target, structures)
    }

    return question
  })
}

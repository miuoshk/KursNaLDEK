export interface OPGStructure {
  id: string
  atlas_id: string
  structure_number: number
  name_pl: string
  name_pl_normalized: string
  accepted_aliases: string[]
  pos_x_pct: number
  pos_y_pct: number
  region:
    | 'maxilla'
    | 'mandible'
    | 'tmj'
    | 'soft_tissue'
    | 'nasal'
    | 'other'
    | null
}

export interface OPGAtlas {
  id: string
  atlas_id: string
  image_url: string
  source_attribution: string | null
  width_px: number | null
  height_px: number | null
}

export type OPGQuizMode = 'mcq' | 'text_input'
export type OPGQuizDirection = 'number_to_name' | 'name_to_number' | 'mix'

export interface OPGQuestion {
  id: string
  targetStructure: OPGStructure
  direction: 'number_to_name' | 'name_to_number'
  mode: 'mcq' | 'text_input'
  distractors?: OPGStructure[]
}

export interface OPGAnswer {
  questionId: string
  isCorrect: boolean
  isClose: boolean
  attempts: number
  userInput: string
  timeSpentMs: number
}

export interface OPGQuizConfig {
  mode: OPGQuizMode
  direction: OPGQuizDirection
  count: number
  atlasId: string
}

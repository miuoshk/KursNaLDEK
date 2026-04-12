'use server'

import { createClient } from '@/lib/supabase/server'
import type { OPGAtlas, OPGStructure } from '../lib/opg/types'

export async function loadOPGAtlas(
  atlasId: string,
): Promise<OPGAtlas | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opg_atlas_images')
    .select('*')
    .eq('atlas_id', atlasId)
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[loadOPGAtlas]', error.message, error.code, error.details)
    throw new Error('Nie udało się wczytać atlasu OPG.')
  }

  return data as OPGAtlas
}

export async function loadOPGStructures(
  atlasId: string,
): Promise<OPGStructure[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opg_structures')
    .select('*')
    .eq('atlas_id', atlasId)
    .order('structure_number', { ascending: true })

  if (error) {
    console.error('[loadOPGStructures]', error.message, error.code, error.details)
    throw new Error('Nie udało się wczytać struktur OPG.')
  }

  return (data ?? []) as OPGStructure[]
}

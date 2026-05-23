/** Gdy sesja dotyczyła jednego tematu — zwraca jego id (do „kolejnej sesji”). */
export function inferSessionTopicId(topicIds: string[]): string | undefined {
  const unique = [...new Set(topicIds.filter(Boolean))];
  if (unique.length === 1) return unique[0];
  return undefined;
}

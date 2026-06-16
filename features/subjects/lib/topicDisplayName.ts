const GENERATED_SUFFIX_RE = /\s*\(generowane\)\s*$/i;

/** Temat z puli generowanej (sufiks w nazwie lub id -GEN). */
export function isGeneratedTopic(topicId: string, name: string): boolean {
  return topicId.endsWith("-GEN") || GENERATED_SUFFIX_RE.test(name.trim());
}

/** Nazwa tematu bez sufiksu „(generowane)” — badge zostaje w UI. */
export function formatTopicDisplayName(name: string): string {
  return name.replace(GENERATED_SUFFIX_RE, "").trim();
}

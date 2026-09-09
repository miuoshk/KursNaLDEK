export type StatementSetItem = {
  id: string;
  text: string;
  isTrue: boolean;
  rationale: string;
  correction?: string;
  number?: number;
};

export type StatementSetBlocks = {
  questionType: "statement_set";
  statements: readonly StatementSetItem[];
  optionStatements: Readonly<Record<string, readonly string[]>>;
};

export type StatementSetDiff = {
  add: string[];
  remove: string[];
};

export function sortedUniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort();
}

export function statementIdSetsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = sortedUniqueIds(left);
  const b = sortedUniqueIds(right);
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function trueStatementIds(
  statements: readonly StatementSetItem[],
): string[] {
  return statements.filter((statement) => statement.isTrue).map((statement) => statement.id);
}

export function computeStatementSetDiff(
  selectedIds: readonly string[],
  trueIds: readonly string[],
): StatementSetDiff {
  const selected = new Set(selectedIds);
  const truth = new Set(trueIds);
  return {
    remove: selectedIds.filter((id) => !truth.has(id)),
    add: trueIds.filter((id) => !selected.has(id)),
  };
}

export function statementDisplayNumber(
  statements: readonly { id: string; number?: number }[],
  statementId: string,
): number | null {
  const index = statements.findIndex((statement) => statement.id === statementId);
  if (index < 0) return null;
  return statements[index]?.number ?? index + 1;
}

export function formatStatementNumbers(
  statements: readonly { id: string }[],
  ids: readonly string[],
): string {
  return ids
    .map((id) => statementDisplayNumber(statements, id))
    .filter((value): value is number => value != null)
    .join(", ");
}

export type StatementSetConsistencyIssue =
  | "missing_option_mapping"
  | "unknown_option"
  | "unknown_statement"
  | "duplicate_statement"
  | "duplicate_number"
  | "empty_mapping"
  | "no_matching_option"
  | "multiple_matching_options"
  | "key_mismatch";

export function statementSetConsistencyIssue(
  blocks: StatementSetBlocks,
  optionIds: readonly string[],
  correctOptionId: string,
): StatementSetConsistencyIssue | null {
  const statementIds = blocks.statements.map((statement) => statement.id);
  if (new Set(statementIds).size !== statementIds.length) {
    return "duplicate_statement";
  }

  const numbers = blocks.statements
    .map((statement) => statement.number)
    .filter((value): value is number => value != null);
  if (new Set(numbers).size !== numbers.length) {
    return "duplicate_number";
  }

  const mappedOptions = Object.keys(blocks.optionStatements);
  if (mappedOptions.some((optionId) => !optionIds.includes(optionId))) {
    return "unknown_option";
  }
  if (optionIds.some((optionId) => blocks.optionStatements[optionId] == null)) {
    return "missing_option_mapping";
  }

  for (const optionId of optionIds) {
    const mapped = blocks.optionStatements[optionId] ?? [];
    if (mapped.length === 0) return "empty_mapping";
    if (mapped.some((id) => !statementIds.includes(id))) {
      return "unknown_statement";
    }
  }

  const truth = trueStatementIds(blocks.statements);
  const matches = optionIds.filter((optionId) =>
    statementIdSetsEqual(blocks.optionStatements[optionId] ?? [], truth),
  );
  if (matches.length === 0) return "no_matching_option";
  if (matches.length > 1) return "multiple_matching_options";
  if (matches[0] !== correctOptionId) return "key_mismatch";
  return null;
}

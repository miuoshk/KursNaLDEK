export const STATEMENT_VERDICT_MD =
  /^\*\*(\d+)\) (.+?) — (prawda|fałsz)\.\*\*/i;

export const STATEMENT_VERDICT_TEXT =
  /^(\d+)\) (.+?) — (prawda|fałsz)\./i;

export type StatementVerdict = {
  n: string;
  statement: string;
  verdict: "prawda" | "fałsz";
  ok: boolean;
};

export function parseStatementVerdictLead(
  text: string,
): StatementVerdict | null {
  const match = text.trim().match(STATEMENT_VERDICT_TEXT);
  if (!match) return null;
  const verdict = match[3].toLowerCase() as "prawda" | "fałsz";
  return {
    n: match[1],
    statement: match[2],
    verdict,
    ok: verdict === "prawda",
  };
}

export function markdownHasStatementVerdicts(md: string): boolean {
  return md.split("\n").some((line) => STATEMENT_VERDICT_MD.test(line.trim()));
}

/**
 * Just enough TypeScript highlighting for the code this editor generates. Every
 * character lands in exactly one token, so the text reads back unchanged.
 */

export type TokenKind = "comment" | "string" | "keyword" | "number" | "function" | "type" | "property" | "plain";
export type Token = { readonly kind: TokenKind; readonly text: string };

const KEYWORDS = "import|export|from|const|type|return|true|false";

const PATTERN = new RegExp(
  [
    "(?<comment>//.*)",
    '(?<string>"(?:[^"\\\\\\n]|\\\\.)*")',
    `(?<keyword>\\b(?:${KEYWORDS})\\b)`,
    "(?<number>-?\\b\\d+(?:\\.\\d+)?\\b)",
    "(?<function>\\b[A-Za-z_$][\\w$]*(?=\\())",
    "(?<property>\\b[A-Za-z_$][\\w$]*(?=:))",
    "(?<type>\\b[A-Z][\\w$]*)",
  ].join("|"),
  "g",
);

const KINDS: readonly Exclude<TokenKind, "plain">[] = ["comment", "string", "keyword", "number", "function", "property", "type"];

export function highlight(line: string): readonly Token[] {
  const tokens: Token[] = [];
  let at = 0;
  for (const match of line.matchAll(PATTERN)) {
    if (match.index > at) tokens.push({ kind: "plain", text: line.slice(at, match.index) });
    const kind = KINDS.find((candidate) => match.groups?.[candidate] !== undefined) ?? "plain";
    tokens.push({ kind, text: match[0] });
    at = match.index + match[0].length;
  }
  if (at < line.length) tokens.push({ kind: "plain", text: line.slice(at) });
  return tokens;
}

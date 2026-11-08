/**
 * A small syntax highlighter for documentation, product code panels and the code
 * in an agent's answers: TypeScript/JavaScript (and JSX), JSON, shell, CSS,
 * HTML, Python, Rust, Go, SQL, YAML, TOML and diffs. It turns code into lines of
 * classified tokens, pure and server-safe, so CodePanel and CodeBlock can render
 * it without shipping a grammar engine. Hosts that already use Shiki can pass
 * their own highlighted children instead.
 */

export type SyntaxToken = { text: string; type?: SyntaxKind };
export type SyntaxKind =
  | "keyword"
  | "string"
  | "number"
  | "function"
  | "type"
  | "comment"
  | "punctuation"
  | "tag"
  | "attribute"
  | "property"
  | "variable"
  | "inserted"
  | "deleted";

const JS_KEYWORDS =
  "import|from|export|default|function|return|const|let|var|if|else|for|while|do|switch|case|break|continue|new|class|extends|implements|interface|type|enum|as|async|await|yield|try|catch|finally|throw|typeof|instanceof|in|of|void|delete|this|super|null|undefined|true|false|satisfies|readonly|public|private|protected|static|declare|namespace|keyof";

type Rule = [RegExp, SyntaxKind | ((match: RegExpExecArray) => SyntaxToken[])];

const jsRules: Rule[] = [
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//y, "comment"],
  [/`(?:[^`\\]|\\[\s\S])*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y, "string"],
  [
    /(<\/?)([A-Za-z][\w.:-]*)/y,
    (m) => [
      { text: m[1]!, type: "punctuation" },
      { text: m[2]!, type: /^[A-Z]/.test(m[2]!) ? "type" : "tag" },
    ],
  ],
  [new RegExp(`\\b(?:${JS_KEYWORDS})\\b`, "y"), "keyword"],
  [/\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/iy, "number"],
  [/[A-Za-z_$][\w$]*(?=\s*(?:<[^()]*>)?\()/y, "function"],
  [/[A-Za-z_$][\w-]*(?==[{"'])/y, "attribute"],
  [/\b[A-Z][\w$]*/y, "type"],
  [/[A-Za-z_$][\w$]*/y, "variable"],
  [/[{}()[\];,.:=<>+\-*/%!?&|^~@#]/y, "punctuation"],
];

const jsonRules: Rule[] = [
  [/"(?:[^"\\\n]|\\.)*"(?=\s*:)/y, "property"],
  [/"(?:[^"\\\n]|\\.)*"/y, "string"],
  [/\b(?:true|false|null)\b/y, "keyword"],
  [/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/iy, "number"],
  [/[{}[\],:]/y, "punctuation"],
];

const shellRules: Rule[] = [
  // A comment starts a line or follows a space; a # inside a word or URL is not one.
  [/(?<![^\s])#[^\n]*/y, "comment"],
  [/"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/y, "string"],
  [/(^|(?<=[\n|;&]\s*))(?:npx|pnpm|yarn|bunx|bun|npm|node|git|curl|docker|cd|export|sudo|cargo|nix)\b/y, "function"],
  [/(?<=\s)--?[\w-]+/y, "attribute"],
  [/\$[\w{}]+/y, "variable"],
  [/[|;&<>\\]/y, "punctuation"],
];

const cssRules: Rule[] = [
  [/\/\*[\s\S]*?\*\//y, "comment"],
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y, "string"],
  [/@[\w-]+/y, "keyword"],
  [/--[\w-]+/y, "variable"],
  [/[\w-]+(?=\s*:[^:{}]*;)/y, "property"],
  [/#[\da-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|ms|s|deg)?\b/iy, "number"],
  [/[\w-]+(?=\()/y, "function"],
  [/[{}();:,>+~*]/y, "punctuation"],
];

const htmlRules: Rule[] = [
  [/<!--[\s\S]*?-->/y, "comment"],
  [
    /(<\/?)([A-Za-z][\w-]*)/y,
    (m) => [
      { text: m[1]!, type: "punctuation" },
      { text: m[2]!, type: "tag" },
    ],
  ],
  [/[\w-]+(?==)/y, "attribute"],
  [/"[^"]*"|'[^']*'/y, "string"],
  [/\/?>|=/y, "punctuation"],
];

const PYTHON_KEYWORDS =
  "def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|lambda|yield|pass|break|continue|global|nonlocal|async|await|assert|del|match|case|self";

const pythonRules: Rule[] = [
  [/#[^\n]*/y, "comment"],
  [/[rRbBuUfF]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/y, "string"],
  [/@[\w.]+/y, "attribute"],
  [new RegExp(`\\b(?:${PYTHON_KEYWORDS})\\b`, "y"), "keyword"],
  [/\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?j?\b/iy, "number"],
  [/[A-Za-z_]\w*(?=\s*\()/y, "function"],
  [/\b[A-Z]\w*/y, "type"],
  [/[A-Za-z_]\w*/y, "variable"],
  [/[{}()[\];,.:=<>+\-*/%!&|^~]/y, "punctuation"],
];

const RUST_KEYWORDS =
  "fn|let|mut|pub|use|mod|struct|enum|impl|trait|for|in|if|else|match|while|loop|return|self|Self|crate|super|as|where|const|static|async|await|move|ref|unsafe|dyn|type|true|false|break|continue|extern";

const RUST_TYPES = "u8|u16|u32|u64|u128|usize|i8|i16|i32|i64|i128|isize|f32|f64|bool|char|str";

const rustRules: Rule[] = [
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//y, "comment"],
  [/r#*"[\s\S]*?"#*|b?"(?:[^"\\]|\\[\s\S])*"|b?'(?:[^'\\\n]|\\.)'/y, "string"],
  [/#!?\[[^\]\n]*\]/y, "attribute"],
  [/'[A-Za-z_]\w*\b(?!')/y, "type"],
  [new RegExp(`\\b(?:${RUST_KEYWORDS})\\b`, "y"), "keyword"],
  [new RegExp(`\\b(?:${RUST_TYPES})\\b`, "y"), "type"],
  [/\b\d[\d_]*(?:\.\d+)?(?:[iuf](?:8|16|32|64|128|size))?\b/y, "number"],
  [/[A-Za-z_]\w*!(?!=)/y, "function"],
  [/[A-Za-z_]\w*(?=\s*(?:::<[^()]*>)?\()/y, "function"],
  [/\b[A-Z]\w*/y, "type"],
  [/[A-Za-z_]\w*/y, "variable"],
  [/[{}()[\];,.:=<>+\-*/%!&|^~?@]/y, "punctuation"],
];

const GO_KEYWORDS =
  "package|import|func|return|if|else|for|range|switch|case|default|break|continue|go|defer|select|chan|map|struct|interface|type|var|const|nil|true|false|fallthrough|goto";
const GO_TYPES = "string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|float32|float64|complex64|complex128|bool|byte|rune|error|any";

const goRules: Rule[] = [
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//y, "comment"],
  [/`[^`]*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y, "string"],
  [new RegExp(`\\b(?:${GO_KEYWORDS})\\b`, "y"), "keyword"],
  [new RegExp(`\\b(?:${GO_TYPES})\\b`, "y"), "type"],
  [/\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/iy, "number"],
  [/[A-Za-z_]\w*(?=\s*\()/y, "function"],
  [/\b[A-Z]\w*/y, "type"],
  [/[A-Za-z_]\w*/y, "variable"],
  [/[{}()[\];,.:=<>+\-*/%!&|^~]/y, "punctuation"],
];

const SQL_KEYWORDS =
  "select|from|where|join|left|right|inner|outer|full|cross|on|and|or|not|null|is|in|as|insert|into|values|update|set|delete|create|table|view|alter|add|drop|column|index|primary|key|foreign|references|group|by|order|having|limit|offset|distinct|union|all|case|when|then|else|end|with|returning|default|unique|constraint|begin|commit|rollback|exists|between|like|ilike|asc|desc|true|false|if|cascade|grant|revoke|to|using|lateral|over|partition|window|interval|filter|coalesce|returns|language|function|trigger|for|each|row|execute|procedure";

const sqlRules: Rule[] = [
  [/--[^\n]*|\/\*[\s\S]*?\*\//y, "comment"],
  [/'(?:[^']|'')*'/y, "string"],
  [/"(?:[^"]|"")*"/y, "property"],
  [new RegExp(`\\b(?:${SQL_KEYWORDS})\\b`, "iy"), "keyword"],
  [/\b\d+(?:\.\d+)?\b/y, "number"],
  [/[A-Za-z_]\w*(?=\s*\()/y, "function"],
  [/::/y, "punctuation"],
  [/[$:@]\w+/y, "variable"],
  [/[A-Za-z_]\w*/y, "variable"],
  [/[(),;.*=<>+\-/%!|]/y, "punctuation"],
];

const yamlRules: Rule[] = [
  [/(?<![^\s])#[^\n]*/y, "comment"],
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\n]|'')*'/y, "string"],
  [/[\w.$/-]+(?=\s*:(?:\s|$))/my, "property"],
  [/[&*][\w-]+/y, "variable"],
  [/\b(?:true|false|yes|no|on|off|null)\b|~/y, "keyword"],
  [/-?\b\d+(?:\.\d+)?\b/y, "number"],
  [/[-:|>?[\]{},]/y, "punctuation"],
];

const tomlRules: Rule[] = [
  [/(?<![^\s])#[^\n]*/y, "comment"],
  // A table header starts its line; a [ after a key is an array.
  [/^[ \t]*\[\[?[^\]\n]+\]\]?/my, "type"],
  [/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/y, "string"],
  [/[\w.-]+(?=\s*=)/y, "property"],
  [/\b(?:true|false)\b/y, "keyword"],
  [/[+-]?\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/iy, "number"],
  [/[=[\]{},.]/y, "punctuation"],
];

// A diff is read a line at a time: what a line starts with says what it is.
const diffRules: Rule[] = [
  [/^(?:diff |index |--- |\+\+\+ )[^\n]*/my, "comment"],
  [/^@@[^\n]*/my, "keyword"],
  [/^\+[^\n]*/my, "inserted"],
  [/^-[^\n]*/my, "deleted"],
  [/[^\n]+/y, "variable"],
];

const LANGUAGES: Record<string, Rule[]> = {
  ts: jsRules,
  tsx: jsRules,
  js: jsRules,
  jsx: jsRules,
  mjs: jsRules,
  typescript: jsRules,
  javascript: jsRules,
  json: jsonRules,
  jsonc: jsonRules,
  bash: shellRules,
  sh: shellRules,
  shell: shellRules,
  zsh: shellRules,
  css: cssRules,
  html: htmlRules,
  xml: htmlRules,
  py: pythonRules,
  python: pythonRules,
  rs: rustRules,
  rust: rustRules,
  go: goRules,
  golang: goRules,
  sql: sqlRules,
  postgres: sqlRules,
  postgresql: sqlRules,
  yaml: yamlRules,
  yml: yamlRules,
  toml: tomlRules,
  diff: diffRules,
  patch: diffRules,
};

/** Languages with rules; anything else renders as plain text. */
export const highlightedLanguages = Object.keys(LANGUAGES);

function tokenize(code: string, rules: Rule[]): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let plain = "";
  let i = 0;
  const flush = () => {
    if (plain) tokens.push({ text: plain });
    plain = "";
  };
  outer: while (i < code.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = i;
      const match = pattern.exec(code);
      if (match && match[0].length > 0) {
        flush();
        if (typeof kind === "function") tokens.push(...kind(match));
        else tokens.push({ text: match[0], type: kind });
        i += match[0].length;
        continue outer;
      }
    }
    plain += code[i];
    i += 1;
  }
  flush();
  return tokens;
}

/** Code as lines of tokens. Tokens that span lines (comments, template strings) are split per line. */
export function highlightCode(code: string, language?: string): SyntaxToken[][] {
  const rules = LANGUAGES[(language ?? "").toLowerCase()];
  const tokens = rules ? tokenize(code, rules) : [{ text: code }];
  const lines: SyntaxToken[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push({ text: part, type: token.type });
    });
  }
  return lines;
}

/** The commands each package manager uses to run and to install packages. */
export const PACKAGE_MANAGERS = {
  npm: { run: "npx", install: "npm install" },
  pnpm: { run: "pnpm dlx", install: "pnpm add" },
  yarn: { run: "yarn dlx", install: "yarn add" },
  bun: { run: "bunx --bun", install: "bun add" },
} as const;

export type PackageManager = keyof typeof PACKAGE_MANAGERS;

/** "shadcn@latest add @fabrials/button" as each package manager writes it. */
export function packageCommand(manager: PackageManager, command: string, kind: "run" | "install" = "run"): string {
  return `${PACKAGE_MANAGERS[manager][kind]} ${command}`;
}

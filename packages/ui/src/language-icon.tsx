import type { ComponentProps, CSSProperties } from "react";
import { Braces, Database, FileCode2, FileText } from "lucide-react";
import { languageAliases, languageMarks, type LanguageMark } from "./language-marks";
import { classes } from "./shared";

// Languages without a logo of their own (or whose logo cannot be shared here) get a plain glyph in the bar's ink.
const GLYPHS: Record<string, typeof FileCode2> = {
  sql: Database,
  postgres: Database,
  postgresql: Database,
  psql: Database,
  mysql: Database,
  sqlite: Database,
  plsql: Database,
  tsql: Database,
  json: Braces,
  jsonc: Braces,
  json5: Braces,
  text: FileText,
  txt: FileText,
  plain: FileText,
  plaintext: FileText,
};

/** The logo a language name or file extension answers to ("py", "python", "tsx"), or null when it has none. */
export function languageMark(language?: string): (LanguageMark & { id: keyof typeof languageMarks }) | null {
  const key = (language ?? "").trim().toLowerCase().replace(/^\./, "");
  const id = languageAliases[key];
  return id ? { id, ...languageMarks[id] } : null;
}

export type LanguageIconProps = Omit<ComponentProps<"svg">, "children"> & {
  /** A language name or file extension: ts, tsx, py, rust, go, bash, yaml… */
  language?: string;
};

/**
 * The logo of a code sample's language, in its own colour, as an editor's tab shows it: TypeScript, Python, Rust, Go, Bash,
 * YAML and two dozen more. A language without a logo of its own gets a plain glyph in the ink around it (a database for SQL,
 * braces for JSON, a page of code otherwise). Decorative: always put the language or the file name beside it. A logo too
 * dark for the dark theme is drawn in the text's ink there, and in forced colours every mark takes the system's text colour.
 */
export function LanguageIcon({ language, className, style, ...props }: LanguageIconProps) {
  const mark = languageMark(language);
  if (mark)
    return (
      <svg
        aria-hidden="true"
        className={classes("fui-language-icon", className)}
        data-ink={mark.ink ? "" : undefined}
        data-language={mark.id}
        data-slot="language-icon"
        fill="currentColor"
        focusable="false"
        style={{ "--fui-language-color": mark.color, ...style } as CSSProperties}
        viewBox="0 0 24 24"
        {...props}
      >
        <path d={mark.path} />
      </svg>
    );
  const key = (language ?? "").trim().toLowerCase();
  const Glyph = GLYPHS[key] ?? (key ? FileCode2 : FileText);
  return (
    <Glyph
      aria-hidden="true"
      className={classes("fui-language-icon", className)}
      data-slot="language-icon"
      focusable="false"
      style={style}
      {...props}
    />
  );
}

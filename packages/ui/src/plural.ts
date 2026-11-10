// Counts in words, in any language: no hooks, no browser APIs, no directive, so a Server Component can call them.

/** The forms a count can take. English uses `one` and `other`; Arabic uses all six. A missing form falls back to `other`. */
export type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

const rules = new Map<string, Intl.PluralRules>();
const numbers = new Map<string, Intl.NumberFormat>();

/** A locale argument as one BCP 47 tag ("en" when there is none), for the APIs that take a single string. */
export function localeTag(locale?: Intl.LocalesArgument): string {
  const first = Array.isArray(locale) ? locale[0] : locale;
  return first ? String(first) : "en";
}

function cacheKey(locale: Intl.LocalesArgument) {
  return Array.isArray(locale) ? locale.map(String).join(",") : String(locale ?? "en");
}

function numberFormat(locale: Intl.LocalesArgument) {
  const key = cacheKey(locale);
  let format = numbers.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale ?? "en");
    numbers.set(key, format);
  }
  return format;
}

/** A count in the locale's digits and grouping: "1,204", "1.204", "١٬٢٠٤". */
export function formatCount(count: number, locale: Intl.LocalesArgument = "en"): string {
  return numberFormat(locale).format(count);
}

/**
 * The form of a phrase for a count, chosen by the locale's plural rules, with `{count}` replaced by the number in the
 * locale's digits: `plural(3, { one: "{count} source", other: "{count} sources" })` is "3 sources".
 */
export function plural(count: number, forms: PluralForms, locale: Intl.LocalesArgument = "en"): string {
  const key = cacheKey(locale);
  let rule = rules.get(key);
  if (!rule) {
    rule = new Intl.PluralRules(locale ?? "en");
    rules.set(key, rule);
  }
  const form = forms[rule.select(count)] ?? forms.other;
  return form.replaceAll("{count}", formatCount(count, locale));
}

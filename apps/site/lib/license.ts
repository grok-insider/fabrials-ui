/**
 * License gate for the aggregator. Components copied into someone else's app
 * must come under a permissive license: copyleft would bind their code, and
 * "MIT plus a clause" is not MIT. Anything this module cannot classify is
 * rejected; in doubt, the gate closes.
 */

export const ALLOWED_LICENSES = ["MIT", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause", "0BSD"] as const;

export type AllowedLicense = (typeof ALLOWED_LICENSES)[number];

const allowed = new Set<string>(ALLOWED_LICENSES);

export function isAllowedLicense(spdx: string | null | undefined): spdx is AllowedLicense {
  return !!spdx && allowed.has(spdx);
}

const normalise = (text: string) => text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n\n").trim();

/**
 * The SPDX id of a license file, or null when the text is not one of the
 * permissive licenses we accept (including when it adds terms to one).
 */
export function classifyLicenseText(raw: string): string | null {
  const text = normalise(raw);
  const flat = text.replace(/\s+/g, " ");
  if (/commons clause/i.test(flat)) return null;
  if (/GNU (AFFERO |LESSER )?GENERAL PUBLIC LICENSE|Mozilla Public License|Server Side Public License|Business Source License|Elastic License/i.test(flat))
    return null;

  if (/Permission is hereby granted, free of charge, to any person obtaining a copy/i.test(flat)) {
    // MIT: the standard grant, the notice condition and the warranty
    // disclaimer, and nothing that takes rights back.
    const grant = /without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and\/or sell copies/i.test(flat);
    const disclaimer = /THE SOFTWARE IS PROVIDED "?AS IS"?, WITHOUT WARRANTY OF ANY KIND/i.test(flat);
    const restricted = /\b(may not|must not|shall not be used|prohibited|non-?commercial|not permitted|resale|resell)\b/i.test(flat);
    return grant && disclaimer && !restricted && flat.length < 1600 ? "MIT" : null;
  }
  if (/Apache License,? Version 2\.0/i.test(flat) && /TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION/i.test(flat))
    return "Apache-2.0";
  if (/Permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee is hereby granted/i.test(flat)) {
    if (/provided that the above copyright notice and this permission notice appear in all copies/i.test(flat)) return "ISC";
    return "0BSD";
  }
  if (/Redistribution and use in source and binary forms, with or without modification, are permitted/i.test(flat)) {
    if (/advertising materials/i.test(flat)) return null; // 4-clause BSD
    return /Neither the name/i.test(flat) ? "BSD-3-Clause" : "BSD-2-Clause";
  }
  return null;
}

/** The copyright line(s) of a license text, for the notice kept in copied files. */
export function copyrightNotice(raw: string): string {
  const lines = normalise(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^copyright\b/i.test(line) || /^\(c\)/i.test(line) || /©/.test(line));
  return lines.join("\n");
}

/**
 * Evaluates an SPDX expression from package metadata ("MIT",
 * "(MIT OR Apache-2.0)", "MIT AND ISC"). OR needs one allowed choice, AND
 * needs all parts allowed. Unknown syntax is rejected.
 */
export function spdxExpressionAllowed(expression: string | null | undefined): boolean {
  if (!expression) return false;
  const expr = expression.trim().replace(/^\((.*)\)$/, "$1").trim();
  if (/\bWITH\b/i.test(expr)) return false;
  const or = expr.split(/\s+OR\s+/i);
  if (or.length > 1) return or.some((part) => spdxExpressionAllowed(part));
  const and = expr.split(/\s+AND\s+/i);
  if (and.length > 1) return and.every((part) => spdxExpressionAllowed(part));
  return isAllowedLicense(expr);
}

/** npm's `license` field comes as a string, an object or a legacy array. */
export function npmLicense(field: unknown): string | null {
  if (typeof field === "string") return field;
  if (field && typeof field === "object" && "type" in field && typeof (field as { type: unknown }).type === "string")
    return (field as { type: string }).type;
  if (Array.isArray(field)) {
    const types = field.map(npmLicense).filter((x): x is string => !!x);
    return types.length ? `(${types.join(" OR ")})` : null;
  }
  return null;
}

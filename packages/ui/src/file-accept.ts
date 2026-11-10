// What a dropzone keeps and what it refuses, as pure functions: no directive, so a server action can apply the same rules
// to the files it receives. Still exported from "./dropzone".

export type FileRejection = { file: File; reason: "type" | "size" | "count" };

/** Whether a file matches an `accept` list (".pdf", "image/*", "application/json"). An empty list accepts everything. */
export function acceptsFile(file: File, accept: string | undefined) {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((rule) =>
    rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule,
  );
}

/** Splits chosen or dropped files into the ones a dropzone keeps and the ones it refuses, with the reason. */
export function sortFiles(files: File[], { accept, maxSize, maxFiles, multiple = true }: { accept?: string; maxSize?: number; maxFiles?: number; multiple?: boolean }) {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  const limit = multiple ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1;
  for (const file of files) {
    if (!acceptsFile(file, accept)) rejected.push({ file, reason: "type" });
    else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: "size" });
    else if (accepted.length >= limit) rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

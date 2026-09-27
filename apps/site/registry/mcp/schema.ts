import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { JsonSchema } from "@/registry/mcp/types";
const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: true,
  validateSchema: true,
});
addFormats(ajv);
export function validateArguments(
  schema: JsonSchema,
  value: unknown,
): string | null {
  try {
    const validate = ajv.compile(schema);
    if (validate(value)) return null;
    return (validate.errors ?? [])
      .map((e) => `${e.instancePath || "Input"} ${e.message}`)
      .join("; ");
  } catch {
    return "This schema cannot be validated locally. Provide a self-contained JSON Schema 2020-12 without external references.";
  }
}
export function simpleFields(
  schema: JsonSchema,
): schema is Exclude<JsonSchema, boolean> {
  if (
    !schema ||
    typeof schema !== "object" ||
    Array.isArray(schema) ||
    schema.type !== "object"
  )
    return false;
  if (
    schema.properties &&
    (typeof schema.properties !== "object" || Array.isArray(schema.properties))
  )
    return false;
  if (
    Object.keys(schema).some((k) =>
      [
        "$ref",
        "allOf",
        "anyOf",
        "oneOf",
        "if",
        "dependentSchemas",
        "patternProperties",
      ].includes(k),
    )
  )
    return false;
  return Object.values(schema.properties ?? {}).every(
    (p) =>
      p !== null &&
      typeof p === "object" &&
      !Array.isArray(p) &&
      ["string", "number", "integer", "boolean"].includes(String(p.type)) &&
      !p.$ref &&
      !p.anyOf &&
      !p.oneOf &&
      !p.allOf,
  );
}

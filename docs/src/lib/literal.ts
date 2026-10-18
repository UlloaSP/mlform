const identifier = /^[A-Za-z_$][\w$]*$/;
const width = 76;

// Prints data as a TypeScript object literal, keeping short objects on one line, so configs that
// drive a capture can be shown exactly as they ran.
export const toLiteral = (value: unknown, indent = ""): string => {
  const inline = toInline(value);
  if (indent.length + inline.length <= width || value === null || typeof value !== "object") {
    return inline;
  }
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    return `[\n${value.map((item) => `${inner}${toLiteral(item, inner)},`).join("\n")}\n${indent}]`;
  }
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return `{\n${entries
    .map(([key, item]) => `${inner}${toKey(key)}: ${toLiteral(item, inner)},`)
    .join("\n")}\n${indent}}`;
};

const toKey = (key: string) => (identifier.test(key) ? key : JSON.stringify(key));

const toInline = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(toInline).join(", ")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";
    return `{ ${entries.map(([key, item]) => `${toKey(key)}: ${toInline(item)}`).join(", ")} }`;
  }
  return JSON.stringify(value);
};

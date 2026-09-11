export type IdentifierCase = "camel" | "pascal";

export interface IdentifierOptions {
  case: IdentifierCase;
  fallback: string;
  reservedWords?: ReadonlySet<string>;
}

function toWords(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function changeCase(words: string[], identifierCase: IdentifierCase) {
  const pascalName = words
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  if (identifierCase === "pascal") {
    return pascalName;
  }

  return pascalName[0].toLowerCase() + pascalName.slice(1);
}

/** 将外部字段名转换为合法标识符，无法转写的内容使用明确的回退名。 */
export function createIdentifier(value: string, options: IdentifierOptions) {
  const words = toWords(value);
  const fallbackWords = toWords(options.fallback);
  const effectiveWords = words.length > 0 ? words : fallbackWords;
  let identifier = changeCase(effectiveWords, options.case);

  if (!/^[A-Za-z_]/.test(identifier)) {
    const prefix = changeCase(fallbackWords, options.case);
    identifier = `${prefix}${changeCase(effectiveWords, "pascal")}`;
  }

  if (options.reservedWords?.has(identifier)) {
    identifier = `${identifier}_`;
  }

  return identifier;
}

/** 同一声明作用域内的字段和类型通过数字后缀确定性去重。 */
export function createUniqueIdentifier(
  value: string,
  usedIdentifiers: Set<string>,
  options: IdentifierOptions,
) {
  const baseIdentifier = createIdentifier(value, options);
  let identifier = baseIdentifier;
  let suffix = 2;

  while (usedIdentifiers.has(identifier)) {
    identifier = `${baseIdentifier}${suffix}`;
    suffix += 1;
  }

  usedIdentifiers.add(identifier);
  return identifier;
}

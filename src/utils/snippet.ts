const VARIABLE_REGEX = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

export function extractVariables(template: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);
  while ((match = regex.exec(template)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

export function interpolateSnippet(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(VARIABLE_REGEX, (_, name: string) => {
    return values[name] ?? `{${name}}`;
  });
}

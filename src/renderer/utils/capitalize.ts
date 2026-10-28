export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('sl') + text.slice(1);
}

export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

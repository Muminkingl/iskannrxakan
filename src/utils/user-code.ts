/**
 * Generates a deterministic, fixed user identification code based on user identity.
 * Format: ISKAN-XXXXXX (e.g. ISKAN-A7F3K9)
 * Always returns the exact same code for the same user across all payment cycles.
 */
export function generateUserCode(userEmailOrId?: string | null): string {
  if (!userEmailOrId) return 'ISKAN-777777';

  const clean = userEmailOrId.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // Convert positive hash to base36 uppercase alphanumeric string
  const positive = Math.abs(hash).toString(36).toUpperCase();
  // Pad if shorter than 6, or take last 6 chars
  const code = (positive + 'A7B8C9').slice(0, 6);

  return `ISKAN-${code}`;
}

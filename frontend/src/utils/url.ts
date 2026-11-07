// Chat input accepts either a full URL ("https://www.gov.kr/...") or a bare
// domain typed without a scheme ("www.gov.kr/abc") -- unlike the old
// type="url" form field, there's no browser-native validation to lean on
// here, so both shapes need to be recognized before a message is routed to
// the guide-generation flow instead of being treated as a chat question.
const BARE_DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i;

export function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    // No scheme -- fall through to the bare-domain check below.
  }

  if (!BARE_DOMAIN_PATTERN.test(trimmed)) return false;
  try {
    new URL(`https://${trimmed}`);
    return true;
  } catch {
    return false;
  }
}

// Only call once isLikelyUrl(input) is true.
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  try {
    return new URL(trimmed).toString();
  } catch {
    return new URL(`https://${trimmed}`).toString();
  }
}

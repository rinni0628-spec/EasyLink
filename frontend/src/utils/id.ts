let counter = 0;

// crypto.randomUUID isn't available in every embedded/older WebView some
// seniors' devices may use, so this falls back to a monotonic counter rather
// than failing outright.
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  counter += 1;
  return `id-${Date.now()}-${counter}`;
}

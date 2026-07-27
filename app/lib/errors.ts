// Supabase Postgrest/Storage errors are often plain `{ message, details, code }`
// objects, not `instanceof Error` — a bare `e instanceof Error` check silently
// swallows their message and falls back to a useless generic string.
export function getErrorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}

import type { ZodError, ZodSchema } from "zod";

export type FieldErrors = Record<string, string>;

export function zodIssuesToFieldErrors(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function parseForm<T>(
  schema: ZodSchema<T>,
  raw: unknown,
): { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors } {
  const r = schema.safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, fieldErrors: zodIssuesToFieldErrors(r.error) };
}

/** Uniform 6-digit numeric join code (000000–999999). */
export function generateNumericJoinCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

/** Try generating codes until `isAvailable` returns true or maxAttempts is reached. */
export async function generateUniqueNumericJoinCode(
  isAvailable: (code: string) => Promise<boolean>,
  maxAttempts = 25,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateNumericJoinCode();
    if (await isAvailable(code)) return code;
  }
  throw new Error("Could not allocate a unique join code");
}

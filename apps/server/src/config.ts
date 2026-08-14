export function cookieSecureFromEnv(value: string | undefined): boolean {
  return value !== "false";
}

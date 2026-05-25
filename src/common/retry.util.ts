export async function withRetry<T>(fn: () => Promise<T>, attempts: number, baseDelayMs: number): Promise<T> {
  let error: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try { return await fn(); } catch (e) { error = e; }
    await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** i));
  }
  throw error;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs));
  return Promise.race([promise, timeoutPromise]);
}

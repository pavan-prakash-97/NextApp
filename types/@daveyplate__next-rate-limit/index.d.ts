declare module "@daveyplate/next-rate-limit" {
  // Minimal typings used by this project. Adjust if you need more methods.
  export type Limiter = {
    check: (req: unknown, points?: number) => Promise<unknown>;
  };

  export default function rateLimit(opts: { interval: number; limit: number }): Limiter;
}
declare module "@daveyplate/next-rate-limit" {
  export type Limiter = {
    check: (req: unknown, points?: number) => Promise<unknown>;
  };

  export default function rateLimit(opts: { interval: number; limit: number }): Limiter;
}

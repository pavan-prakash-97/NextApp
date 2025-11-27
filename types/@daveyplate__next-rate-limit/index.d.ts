declare module "@daveyplate/next-rate-limit" {
	import type { NextRequest } from "next/server";

	export type Limiter = {
		check(req: NextRequest, points?: number): Promise<void>;
	};

	export default function makeLimiter(opts: { interval: number; limit: number }): Limiter;
}


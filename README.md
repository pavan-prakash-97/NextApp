This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Redis Integration

This project includes a lightweight Redis client and utilities under `app/lib/redis.ts`.

- Add `REDIS_URL` to `.env` (e.g. `redis://127.0.0.1:6379`) or set it in your hosting provider.
- The app uses Redis for distributed rate limiting (server-side), caching utilities, and optional job queues.

Notes:
- Next.js middleware executes in the Edge runtime and cannot open standard TCP sockets to Redis. As a result, middleware rate limiting still uses the in-memory limiter while server-side route handlers (Node runtime) use Redis-based limiting where configured.
- There is a test route at `/api/redis/ping` to verify connectivity.

### Quick tests

1) Start Redis in Docker (if you don't already have a running instance):

```bash
docker run --name nextapp-redis -p 6379:6379 -d redis:7-alpine
```

2) Add `REDIS_URL` to your `.env` (or set `REDIS_HOST`/`REDIS_PORT`):

```bash
# Example .env settings
REDIS_URL="redis://127.0.0.1:6379"
```

3) Start the app in dev mode and confirm Redis connection.

```bash
npm run dev
```

4) Verify connectivity from the app using the `/api/redis/ping` route:

```bash
curl http://localhost:3000/api/redis/ping
# expected: { "ok": true, "timestamp":"..." }
```

5) Run the simple Node connectivity test script (programmatic set/get/ttl):

```bash
npm run test:redis
```

6) (Optional) Test the Redis-backed server-side rate limiter by performing repeated calls to the server route that uses the Redis limiter (for example `/api/auth/session`), then check Redis for keys:

```bash
# Make many requests quickly; the endpoint will return 429 after the limit is reached
for i in {1..220}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/session; done

# Check the Redis keys used by the limiter
redis-cli --raw --scan --pattern 'rl:*' | xargs -I{} redis-cli ttl {}
```

If the Redis limiter is active you should see keys under `rl:` and TTL values greater than 0.

Notes:
- Middleware runs in the Edge runtime and doesn't support a TCP Redis client — the app falls back to in-memory limiting in middleware and uses Redis in server-side Node runtime to provide distributed counters across multiple instances.
- If you need a durable queue for cron jobs, consider adding BullMQ or RSMQ; I can help add a job processor if you'd like.

### Caching behavior tests (admin user list & user detail cache)

- The admin user list is cached in Redis under key `cache:users:all` (TTL configurable by `REDIS_CACHE_TTL`).
- Individual user details are cached under `cache:user:<id>`.

To test cache behavior, run these commands while the app and Redis are running:

```bash
# After loading the admin user list page (or calling the user list endpoint), inspect the cache key
redis-cli get cache:users:all | head -n 1

# Query TTL
redis-cli ttl cache:users:all

# Inspect a particular user cache (replace <user-id>)
redis-cli get cache:user:<user-id>
```

You should see JSON payloads and TTL values when the cache is active. When a user updates their profile via the API, the keys `cache:user:<id>` and `cache:users:all` are invalidated.



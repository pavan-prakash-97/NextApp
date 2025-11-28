import { createClient, RedisClientType } from "redis";

let client: RedisClientType | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __redis_client: RedisClientType | undefined;
}

function getRedisUrl(): string {
  return (
    process.env.REDIS_URL ||
    process.env.REDIS_HOST && `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` ||
    "redis://127.0.0.1:6379"
  );
}

export function getRedisClient(): RedisClientType {
  if (client) return client;

  // In development/Node environments (with HMR), the module may be reloaded
  // frequently; keep a singleton on `global` to re-use the client instance.
  // This avoids 'max clients' errors for dev servers.
  if (global.__redis_client) {
    client = global.__redis_client;
    return client;
  }

  const url = getRedisUrl();
  client = createClient({ url });
  client.on("error", (err) => {
    // Keep friendly logs for local development / debugging
    // eslint-disable-next-line no-console
    console.error("Redis client error", err?.message ?? err);
  });

  // Connect lazily (don't await here) to avoid blocking imports.
  // Any call to redis on server functions should ensure client.connect() is called.
  client.connect().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed connecting to Redis client:", err?.message ?? err);
  });

  global.__redis_client = client;
  return client;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const c = getRedisClient();
    const pong = await c.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export default getRedisClient();

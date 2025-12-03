import { createClient, RedisClientType } from "redis";

let client: RedisClientType | undefined;

declare global {
  var __redis_client: RedisClientType | undefined;
}

function getRedisUrl(): string {
  return (
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST &&
      `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`) ||
    "redis://127.0.0.1:6379"
  );
}

export function getRedisClient(): RedisClientType {
  if (client) return client;

  // reuse client across HMR
  if (global.__redis_client) {
    client = global.__redis_client;
    return client;
  }

  const url = getRedisUrl();
  client = createClient({ url });

  client.on("error", (err) => {
    console.error("Redis client error:", err?.message ?? err);
  });

  client.connect().catch((err) => {
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

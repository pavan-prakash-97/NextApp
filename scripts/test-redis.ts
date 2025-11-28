import "dotenv/config";
import { createClient } from "redis";

async function main() {
  const url = process.env.REDIS_URL || `redis://127.0.0.1:6379`;
  console.log(`Trying to connect to Redis at ${url}`);
  const client = createClient({ url });
  client.on("error", (err) => console.error("Redis Error:", err));
  await client.connect();
  console.log("Connected to Redis");

  const testKey = `nextapp:test:${Date.now()}`;
  const timestamp = new Date().toISOString();
  await client.set(testKey, timestamp, { EX: 60 });
  console.log(`Set ${testKey} -> ${timestamp}`);

  const result = await client.get(testKey);
  console.log(`Get ${testKey} -> ${result}`);

  const ttl = await client.ttl(testKey);
  console.log(`TTL for ${testKey} -> ${ttl}s`);

  await client.del(testKey);
  await client.quit();
  console.log("Test complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

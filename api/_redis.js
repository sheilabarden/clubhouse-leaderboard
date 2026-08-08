// Shared Redis client. Works whether Vercel provisioned a "KV" store (KV_REST_API_* env vars)
// or an "Upstash for Redis" store (UPSTASH_REDIS_REST_* env vars).
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = new Redis({ url, token });
export const KEY = 'clubhouse_board';

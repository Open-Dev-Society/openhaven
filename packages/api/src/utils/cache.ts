import Redis from "ioredis";

const getRedisUrl = () => {
    if (process.env.REDIS_URL) return process.env.REDIS_URL;

    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        // Convert HTTP URL to TCP Connection String
        // Input: https://something.upstash.io
        // Output: rediss://default:TOKEN@something.upstash.io:6379
        try {
            const host = process.env.UPSTASH_REDIS_URL.replace("https://", "").replace("http://", "");
            return `rediss://default:${process.env.UPSTASH_REDIS_TOKEN}@${host}:6379`;
        } catch (e) {
            console.error("Failed to parse Upstash URL:", e);
        }
    }

    return "redis://localhost:6379";
};

const REDIS_URL = getRedisUrl();
console.log("Initializing Redis with:", REDIS_URL.includes("localhost") ? "Localhost" : "Remote URL");

export const redis = new Redis(REDIS_URL);

redis.on("error", (err) => {
    // Suppress connection refused logs in dev if not using redis
    if ((err as any).code === 'ECONNREFUSED') {
        console.warn("Redis connection failed (ECONNREFUSED). Ensure Redis is running or check credentials.");
    } else {
        console.error("Redis Error:", err);
    }
});

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch (err) {
        console.error(`Cache get error for key ${key}:`, err);
        return null;
    }
};

export const cacheSet = async (
    key: string,
    value: any,
    ttlSeconds?: number
): Promise<void> => {
    try {
        const data = JSON.stringify(value);
        if (ttlSeconds) {
            await redis.set(key, data, "EX", ttlSeconds);
        } else {
            await redis.set(key, data);
        }
    } catch (err) {
        console.error(`Cache set error for key ${key}:`, err);
    }
};

export const cacheDelete = async (key: string): Promise<void> => {
    try {
        await redis.del(key);
    } catch (err) {
        console.error(`Cache delete error for key ${key}:`, err);
    }
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (err) {
        console.error(`Cache delete pattern error for ${pattern}:`, err);
    }
};

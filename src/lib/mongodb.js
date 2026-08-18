import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

function isPlaceholderUri(uri) {
    if (!uri) return true;
    if (uri.includes("<") || uri.includes(">")) return true;
    return false;
}

const IS_DB_CONFIGURED = !isPlaceholderUri(MONGODB_URI);

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = {
        conn: null,
        promise: null,
    };
}

export function isMongoConfigured() {
    return IS_DB_CONFIGURED;
}

/**
 * Cached Mongoose connection for Next.js App Router.
 * Reuses the same connection across hot reloads and serverless invocations.
 */
async function connectDB() {
    if (!IS_DB_CONFIGURED) {
        throw new Error(
            "MONGODB_URI is missing or still a placeholder. Set it in .env.local."
        );
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                dbName: "Online_store",
                serverSelectionTimeoutMS: 8000,
                bufferCommands: false,
            })
            .then((m) => m)
            .catch((err) => {
                console.error("[mongodb] connection failed:", err.message);
                cached.promise = null;
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;

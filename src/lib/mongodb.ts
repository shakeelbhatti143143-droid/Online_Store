import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export function isPlaceholderUri(uri?: string): boolean {
  if (!uri) return true;
  if (uri.includes('<') || uri.includes('>')) return true;
  return false;
}

export function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return !isPlaceholderUri(uri);
}

/**
 * Robust, production-grade cached Mongoose connection for Next.js App Router and Vercel Serverless.
 * Automatically targets the configured database (defaults to 'Online_store') and
 * detects stale TCP connections when serverless containers thaw.
 */
async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri || isPlaceholderUri(uri)) {
    throw new Error(
      'MONGODB_URI is missing or still a placeholder. Please configure MONGODB_URI in your environment variables.'
    );
  }

  // If we have an active, verified connection, return it immediately
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  // If connection is in a disconnected or disconnecting state, reset cached connection
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached!.conn = null;
    cached!.promise = null;
  }

  if (!cached!.promise) {
    const dbName = process.env.MONGODB_DB_NAME || 'Online_store';

    const opts: mongoose.ConnectOptions = {
      dbName,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      bufferCommands: false,
    };

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        const activeDb = m.connection.name;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[mongodb] Connected to database: "${activeDb}"`);
        }
        return m;
      })
      .catch((err) => {
        cached!.conn = null;
        cached!.promise = null;
        console.error('[mongodb] Connection failed:', err instanceof Error ? err.message : String(err));
        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (err) {
    cached!.promise = null;
    cached!.conn = null;
    throw err;
  }

  return cached!.conn;
}

export default connectDB;

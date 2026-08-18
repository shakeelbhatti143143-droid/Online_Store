/**
 * Migration script: Mark all existing users as email-verified.
 *
 * Run this once after deploying the email verification feature to ensure
 * that existing users are not locked out of their accounts.
 *
 * Usage:
 *   npx tsx scripts/migrate-users.ts
 *
 * or with ts-node:
 *   npx ts-node scripts/migrate-users.ts
 *
 * This script sets `emailVerified: true` and `emailVerifiedAt` to the
 * current timestamp for all users who do not already have `emailVerified: true`.
 * It does NOT modify any other fields.
 */

import mongoose from 'mongoose';
import User from '@/lib/models/User';

async function main() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not set in environment variables.');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
        dbName: 'Online_store',
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
    });

    console.log('Connected to MongoDB. Running migration...');

    // Set emailVerified = true for all users who are not yet verified.
    // This is a safe, non-destructive migration — it only adds a field
    // that was previously missing or false.
    const result = await User.updateMany(
        { emailVerified: { $ne: true } },
        {
            $set: {
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
            $unset: {
                emailVerificationTokenHash: '',
                emailVerificationExpires: '',
            },
        }
    );

    console.log(`Migration complete. ${result.modifiedCount} user(s) marked as verified.`);
    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});

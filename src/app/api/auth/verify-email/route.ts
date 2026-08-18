import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashVerificationToken } from '@/lib/tokens';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 10 verification attempts per IP per 15 minutes
const VERIFY_RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

export async function GET(request: NextRequest) {
    try {
        // --- Rate limiting ---
        const clientIp = getClientIp(request);
        const rl = rateLimit(`verify:${clientIp}`, VERIFY_RATE_LIMIT.max, VERIFY_RATE_LIMIT.windowMs);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many verification attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { error: 'Invalid verification link.' },
                { status: 400 }
            );
        }

        // Hash the provided token and find the matching user
        const tokenHash = hashVerificationToken(token);

        await connectDB();

        // Find the user by the hashed token (single-use: token must still be set)
        const user = await User.findOne({
            emailVerificationTokenHash: tokenHash,
            emailVerified: false,
        });

        if (!user) {
            // The token may be invalid, already used, or the user is already verified.
            // Check if the user is already verified to give a more specific message.
            const anyUser = await User.findOne({ emailVerificationTokenHash: tokenHash });
            if (anyUser && anyUser.emailVerified) {
                return NextResponse.json(
                    { error: 'Email already verified.', alreadyVerified: true },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'Invalid verification link.' },
                { status: 400 }
            );
        }

        // Check token expiration
        if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
            // Token expired — clear it so it can't be reused
            user.emailVerificationTokenHash = null;
            user.emailVerificationExpires = null;
            await user.save();

            return NextResponse.json(
                {
                    error: 'Verification link expired.',
                    expired: true,
                    email: user.email,
                },
                { status: 410 }
            );
        }

        // --- Valid token: verify the email ---
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.emailVerificationTokenHash = null;
        user.emailVerificationExpires = null;
        await user.save();

        // Return success — the frontend page will show the success message
        // and provide a "Go to Sign In" button.
        return NextResponse.json(
            {
                message: 'Email verified successfully.',
                verified: true,
                email: user.email,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[verify-email] error:', error);
        return NextResponse.json(
            { error: 'Something went wrong during verification. Please try again.' },
            { status: 500 }
        );
    }
}

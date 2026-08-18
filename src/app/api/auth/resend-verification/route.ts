import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { normalizeEmail } from '@/lib/config';
import {
    generateVerificationToken,
    hashVerificationToken,
    computeVerificationExpiry,
} from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 3 resend requests per IP per hour
const RESEND_RATE_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
    try {
        // --- Rate limiting ---
        const clientIp = getClientIp(request);
        const rl = rateLimit(`resend:${clientIp}`, RESEND_RATE_LIMIT.max, RESEND_RATE_LIMIT.windowMs);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address.' },
                { status: 400 }
            );
        }

        const normalizedEmail = normalizeEmail(email);

        await connectDB();

        // Find the user by email
        const user = await User.findOne({ email: normalizedEmail });

        // Always return the same generic response to prevent email enumeration.
        // Only send a new email if the account exists and is not yet verified.
        if (user && !user.emailVerified) {
            // Generate a new token, replacing the old one (single-use invalidation)
            const rawToken = generateVerificationToken();
            const tokenHash = hashVerificationToken(rawToken);
            const expiresAt = computeVerificationExpiry();

            user.emailVerificationTokenHash = tokenHash;
            user.emailVerificationExpires = expiresAt;
            await user.save();

            try {
                await sendVerificationEmail(normalizedEmail, rawToken, expiresAt);
            } catch (emailErr) {
                console.error('[resend-verification] Failed to send verification email:', emailErr);
            }
        }

        // Generic response — do not reveal whether the email exists
        return NextResponse.json(
            {
                message: 'If the account exists and requires verification, a verification email has been sent.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[resend-verification] error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}

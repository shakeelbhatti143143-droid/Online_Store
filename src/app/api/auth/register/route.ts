import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import { hashPassword } from '@/lib/auth';
import { normalizeEmail, isAdminEmail } from '@/lib/config';
import {
  generateVerificationToken,
  hashVerificationToken,
  computeVerificationExpiry,
} from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 5 registrations per IP per hour
const REGISTER_RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const clientIp = getClientIp(request);
    const rl = rateLimit(`register:${clientIp}`, REGISTER_RATE_LIMIT.max, REGISTER_RATE_LIMIT.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, fullName, password } = body;

    // Validate required fields
    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'Email, full name, and password are required.' },
        { status: 400 }
      );
    }
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    await connectDB();

    // Check for existing account (prevent duplicates)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // If the reserved admin email exists, prevent re-registration
      if (isAdminEmail(normalizedEmail)) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Server-side role assignment: never trust a role from the frontend.
    const role = isAdminEmail(normalizedEmail) ? 'admin' : 'user';

    const hashedPassword = await hashPassword(password);

    // --- Email verification ---
    const rawToken = generateVerificationToken();
    const tokenHash = hashVerificationToken(rawToken);
    const expiresAt = computeVerificationExpiry();

    const user = await User.create({
      email: normalizedEmail,
      fullName: fullName.trim(),
      password: hashedPassword,
      role,
      isActive: true,
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: expiresAt,
      emailVerifiedAt: null,
    });

    // Log admin account creation (if applicable)
    if (role === 'admin') {
      try {
        await AdminLog.create({
          adminId: user._id,
          action: 'ADMIN_ACCOUNT_CREATED',
          entityType: 'auth',
          entityId: '',
          details: {
            email: user.email,
            message: 'Admin account created successfully (pending email verification)',
            ip: clientIp,
          },
        });
      } catch (logErr) {
        console.error('[register] AdminLog error:', logErr);
      }
    }

    // Send verification email (do not block registration on email failure,
    // but log the error for investigation)
    try {
      await sendVerificationEmail(normalizedEmail, rawToken, expiresAt);
    } catch (emailErr) {
      console.error('[register] Failed to send verification email:', emailErr);
      // The account is still created; the user can use the resend endpoint.
    }

    // Do NOT create a session. The user must verify their email first.
    return NextResponse.json(
      {
        message: 'Account created. Please check your email to verify your account.',
        requiresVerification: true,
        email: normalizedEmail,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Something went wrong while creating your account. Please try again.' },
      { status: 500 }
    );
  }
}

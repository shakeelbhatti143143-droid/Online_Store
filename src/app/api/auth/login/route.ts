import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import { verifyPassword, signToken, toUserProfile } from '@/lib/auth';
import { setAdminSessionCookie, signAdminSession } from '@/lib/admin-session';
import { normalizeEmail } from '@/lib/config';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 10 login attempts per IP per 15 minutes
const LOGIN_RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const clientIp = getClientIp(request);
    const rl = rateLimit(`login:${clientIp}`, LOGIN_RATE_LIMIT.max, LOGIN_RATE_LIMIT.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(String(email));

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email. Please register first.' }, { status: 401 });
    }
    if (user.isActive === false) {
      return NextResponse.json({ error: 'This account has been deactivated.' }, { status: 403 });
    }

    // --- Email verification check ---
    // Do not allow login until the email is verified.
    if (user.emailVerified !== true) {
      return NextResponse.json(
        {
          error: 'Please verify your email before logging in.',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // Log failed admin login attempt
      if (user.role === 'admin') {
        try {
          await AdminLog.create({
            adminId: user._id,
            action: 'ADMIN_LOGIN_FAILED',
            entityType: 'auth',
            entityId: '',
            details: {
              email: user.email,
              reason: 'invalid_password',
              ip: clientIp,
            },
          });
        } catch (logErr) {
          console.error('[login] AdminLog error:', logErr);
        }
      }
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    const token = signToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    // If admin logs in, create admin session cookie and log success
    let response: NextResponse;
    if (user.role === 'admin') {
      try {
        await AdminLog.create({
          adminId: user._id,
          action: 'ADMIN_LOGIN_SUCCESS',
          entityType: 'auth',
          entityId: '',
          details: {
            email: user.email,
            message: 'Admin successfully logged in',
            ip: clientIp,
          },
        });
      } catch (logErr) {
        console.error('[login] AdminLog error:', logErr);
      }

      const adminToken = signAdminSession({
        adminId: String(user._id),
        email: user.email,
        role: user.role,
      });
      response = NextResponse.json({
        message: 'Signed in successfully.',
        user: toUserProfile(user),
        token,
        redirectTo: '/admin',
      });
      setAdminSessionCookie(response, adminToken);
    } else {
      response = NextResponse.json({
        message: 'Signed in successfully.',
        user: toUserProfile(user),
        token,
        redirectTo: '/account',
      });
      // Set a non-HTTP-only cookie so middleware can detect regular user sessions
      response.cookies.set('luxe_auth_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Something went wrong while signing in. Please try again.' }, { status: 500 });
  }
}

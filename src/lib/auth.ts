import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserProfile } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'luxe-atelier-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: string;
}

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export function signToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthTokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch {
        return null;
    }
}

export function toUserProfile(user: {
    _id: unknown;
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
    role: string;
    createdAt: string | Date;
    emailVerified?: boolean;
}): UserProfile {
    return {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        role: user.role as UserProfile['role'],
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        emailVerified: user.emailVerified ?? false,
    };
}

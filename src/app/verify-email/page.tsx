'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

type VerificationState = 'verifying' | 'success' | 'expired' | 'invalid' | 'already-verified';

function VerifyEmailPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { resendVerification } = useAuth();
    const [state, setState] = useState<VerificationState>('verifying');
    const [email, setEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setState('invalid');
            return;
        }

        // Call the verification API
        fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                if (res.ok) {
                    setState('success');
                } else {
                    const data = await res.json();
                    if (data.alreadyVerified) {
                        setState('already-verified');
                    } else if (data.expired) {
                        setState('expired');
                        if (data.email) setEmail(data.email);
                    } else {
                        setState('invalid');
                    }
                }
            })
            .catch(() => {
                setState('invalid');
            });
    }, [token]);

    const handleResend = async () => {
        if (!email) return;
        setIsResending(true);
        try {
            await resendVerification(email);
        } finally {
            setIsResending(false);
        }
    };

    const handleGoToLogin = () => {
        router.push('/?auth=login');
    };

    const renderContent = () => {
        switch (state) {
            case 'verifying':
                return (
                    <div className="flex flex-col items-center text-center space-y-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                            <Sparkles className="w-12 h-12 text-gold-400" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
                        <p className="text-sm text-gray-400">Please wait while we verify your email address.</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Email Verified Successfully</h2>
                            <p className="text-sm text-gray-400 mt-2">
                                Your email address has been verified. You can now sign in to your account.
                            </p>
                        </div>
                        <Button variant="gold" size="md" onClick={handleGoToLogin}>
                            Go to Sign In
                        </Button>
                    </div>
                );

            case 'expired':
                return (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Verification Link Expired</h2>
                            <p className="text-sm text-gray-400 mt-2">
                                The verification link has expired. Please request a new verification email.
                            </p>
                        </div>
                        <div className="w-full max-w-sm">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<Mail className="w-4 h-4" />}
                                autoComplete="email"
                            />
                        </div>
                        <Button
                            variant="gold"
                            size="md"
                            leftIcon={isResending ? undefined : <Mail className="w-4 h-4" />}
                            isLoading={isResending}
                            onClick={handleResend}
                            disabled={!email}
                        >
                            {isResending ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                    </div>
                );

            case 'invalid':
                return (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Invalid Verification Link</h2>
                            <p className="text-sm text-gray-400 mt-2">
                                The verification link is invalid or has already been used.
                            </p>
                        </div>
                        <Button variant="gold" size="md" onClick={handleGoToLogin}>
                            Go to Sign In
                        </Button>
                    </div>
                );

            case 'already-verified':
                return (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Email Already Verified</h2>
                            <p className="text-sm text-gray-400 mt-2">
                                Your email address has already been verified. You can sign in to your account.
                            </p>
                        </div>
                        <Button variant="gold" size="md" onClick={handleGoToLogin}>
                            Go to Sign In
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center pt-24 pb-16 px-4">
            <div className="w-full max-w-md">
                <div className="rounded-3xl glass-panel bg-surface-200/90 border border-border-light shadow-2xl p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-700 p-0.5">
                            <div className="w-full h-full bg-surface-300 rounded-[6px] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-gold-400" />
                            </div>
                        </div>
                        <span className="text-xl font-bold tracking-wider text-white uppercase font-display ml-2">
                            LUXE<span className="text-gold-400 font-light">ATELIER</span>
                        </span>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <VerifyEmailPageContent />
        </Suspense>
    );
}

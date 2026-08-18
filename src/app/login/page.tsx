'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login, register, resendVerification } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    // Check for ?verified=true query parameter
    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setShowVerifiedMessage(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            setFormError('Please enter a valid email address.');
            return;
        }

        if (mode === 'register') {
            if (fullName.trim().length < 2) {
                setFormError('Please enter your full name (at least 2 characters).');
                return;
            }
            if (password.length < 6) {
                setFormError('Password must be at least 6 characters long.');
                return;
            }
            if (password !== confirmPassword) {
                setFormError('Passwords do not match.');
                return;
            }
        } else {
            if (!password) {
                setFormError('Please enter your password.');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            let success: boolean;
            if (mode === 'login') {
                success = await login(email, password);
            } else {
                success = await register(email, fullName, password);
                if (success) {
                    setRegistrationSuccess(true);
                    setRegisteredEmail(email);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendVerification = async () => {
        if (!registeredEmail) return;
        setIsResending(true);
        try {
            await resendVerification(registeredEmail);
        } finally {
            setIsResending(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setFormError('');
        setPassword('');
        setConfirmPassword('');
        setRegistrationSuccess(false);
        setRegisteredEmail('');
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

                    {/* Email Verified Success Message */}
                    {showVerifiedMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                        >
                            <div className="flex flex-col items-center text-center space-y-3 py-4">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Email Verified Successfully</h3>
                                    <p className="text-sm text-gray-400">
                                        Your email has been verified. You can now sign in below.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Registration Success / Verification Message */}
                    {registrationSuccess && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                        >
                            <div className="flex flex-col items-center text-center space-y-4 py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Account Created</h3>
                                    <p className="text-sm text-gray-300 mt-1">
                                        Please check your email to verify your account.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        We sent a verification link to <span className="text-gray-200">{registeredEmail}</span>
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={isResending ? undefined : <Mail className="w-4 h-4" />}
                                    isLoading={isResending}
                                    onClick={handleResendVerification}
                                >
                                    {isResending ? 'Resending...' : 'Resend Verification Email'}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {!registrationSuccess && (
                        <>
                            {/* Mode Tabs */}
                            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-100 border border-border-light mb-6">
                                {(['login', 'register'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === m
                                                ? 'bg-gold-500 text-black shadow-md shadow-gold-500/25'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {m === 'login' ? 'Sign In' : 'Register'}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'register' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Input
                                            label="Full Name"
                                            type="text"
                                            placeholder="Alexander Wright"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            leftIcon={<User className="w-4 h-4" />}
                                            autoComplete="name"
                                        />
                                    </motion.div>
                                )}

                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    leftIcon={<Mail className="w-4 h-4" />}
                                    autoComplete="email"
                                />

                                <div className="relative">
                                    <Input
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        leftIcon={<Lock className="w-4 h-4" />}
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-[34px] text-gray-400 hover:text-white transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {mode === 'register' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <Input
                                            label="Confirm Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            leftIcon={<Lock className="w-4 h-4" />}
                                            autoComplete="new-password"
                                        />
                                    </motion.div>
                                )}

                                {formError && (
                                    <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                                        {formError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant="gold"
                                    size="lg"
                                    className="w-full"
                                    isLoading={isSubmitting}
                                >
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                </Button>

                                <p className="text-center text-xs text-gray-400">
                                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                    <button
                                        type="button"
                                        onClick={switchMode}
                                        className="text-gold-400 font-semibold hover:text-gold-300 transition-colors"
                                    >
                                        {mode === 'login' ? 'Register now' : 'Sign in'}
                                    </button>
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

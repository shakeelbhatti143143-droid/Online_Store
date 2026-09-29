'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

function LoginPageContent() {
  const searchParams = useSearchParams();
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
    <div className="min-h-screen bg-white flex items-center justify-center pt-28 pb-20 px-4 text-slate-900">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl p-8 sm:p-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 p-0.5 shadow-sm">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-wider text-slate-900 uppercase font-display ml-2.5">
              LUXE<span className="text-amber-700 font-light">ATELIER</span>
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
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Email Verified Successfully
                  </h3>
                  <p className="text-sm text-slate-500">
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
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Account Created
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Please check your email to verify your account.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    We sent a verification link to{' '}
                    <span className="text-slate-800 font-semibold">
                      {registeredEmail}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={
                    isResending ? undefined : <Mail className="w-4 h-4" />
                  }
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
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      mode === m
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
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
                    placeholder={
                      mode === 'register'
                        ? 'At least 6 characters'
                        : 'Your password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[34px] text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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
                  <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full font-bold shadow-md shadow-amber-600/15"
                  isLoading={isSubmitting}
                >
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>

                <p className="text-center text-xs text-slate-500 pt-1">
                  {mode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-amber-700 font-bold hover:text-amber-800 transition-colors"
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-white" />}
    >
      <LoginPageContent />
    </Suspense>
  );
}

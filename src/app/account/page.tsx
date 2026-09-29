'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Save,
  LogOut,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AccountPage() {
  const { user, isAdmin, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [addressLine1, setAddressLine1] = useState(
    '100 Central Park South'
  );
  const [city, setCity] = useState('New York');
  const [state, setState] = useState('NY');
  const [postalCode, setPostalCode] = useState('10019');
  const [country, setCountry] = useState('United States');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, email, phone });
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-24 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP Atelier Member</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Collector Profile & Preferences
            </h1>
          </div>

          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="gold"
                size="sm"
                leftIcon={<LayoutDashboard className="w-4 h-4" />}
              >
                Go to Admin Portal
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Navigation Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-slate-50/80 p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-lg font-display shadow-xs">
                  {user?.fullName ? user.fullName[0] : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {user?.fullName || 'Collector'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                    {user?.role} Access
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  href="/account"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-amber-800 font-bold text-xs shadow-xs"
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Profile & Addresses</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white font-semibold text-xs transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  <span>Order History & Tracking</span>
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-xs space-y-3">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Account Details
              </p>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="flex items-center justify-between">
                  <span>Member Since</span>
                  <span className="text-slate-800 font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Account Type</span>
                  <span className="text-amber-700 font-semibold uppercase">
                    {user?.role || '—'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Forms (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Personal Info Form */}
            <form
              onSubmit={handleSave}
              className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Personal Information
                </h3>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                />
                <Input
                  label="VIP Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@luxury.com"
                />
              </div>

              <Input
                label="Direct Telephone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>

            {/* Default Shipping Address */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Primary Vault Address
                </h3>
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>

              <Input
                label="Street Address"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  label="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="secondary" size="md">
                  Update Vault Address
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Save,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Camera,
  UploadCloud,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash,
  Globe,
  Bell,
  ChevronRight,
  Heart,
  Package,
  Award,
  Loader2,
  Check,
  Smartphone,
  ExternalLink,
  Crown,
  ArrowUpRight,
  Shield,
  Zap,
  Mail,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useWishlist } from '@/context/WishlistContext';
import { storeApi, authHeaders } from '@/lib/api/store-client';
import { Address } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate } from '@/lib/utils';

// Bespoke Luxury Portrait Presets
const PRESET_AVATARS = [
  {
    id: 'preset-1',
    name: 'Atelier Noir',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-2',
    name: 'Haute Horology',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-3',
    name: 'Royal Connoisseur',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-4',
    name: 'Gemstone Stylist',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-5',
    name: 'Onyx Minimalist',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-6',
    name: 'Emerald Patron',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=350&auto=format&fit=crop&q=80',
  },
];

type ActiveTab = 'profile' | 'addresses' | 'security' | 'preferences';

export default function AccountPage() {
  const { user, isAdmin, updateProfile, logout, resendVerification, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { wishlistCount } = useWishlist();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [title, setTitle] = useState(user?.title || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'USD');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Notifications State
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(user?.newsletterSubscribed ?? true);
  const [orderNotifications, setOrderNotifications] = useState(user?.orderNotifications ?? true);
  const [vipOffers, setVipOffers] = useState(user?.vipOffers ?? true);
  const [securityAlerts, setSecurityAlerts] = useState(user?.securityAlerts ?? true);

  // Avatar Upload & Interaction State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saving State
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false,
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Customer Orders Summary
  const [ordersCount, setOrdersCount] = useState<number>(user?.ordersCount || 0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // Sync state when user context is loaded or changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setTitle(user.title || '');
      setDateOfBirth(user.dateOfBirth || '');
      setPreferredCurrency(user.preferredCurrency || 'USD');
      setAvatarUrl(user.avatarUrl || '');
      setNewsletterSubscribed(user.newsletterSubscribed ?? true);
      setOrderNotifications(user.orderNotifications ?? true);
      setVipOffers(user.vipOffers ?? true);
      setSecurityAlerts(user.securityAlerts ?? true);
      if (user.ordersCount !== undefined) {
        setOrdersCount(user.ordersCount);
      }
    }
  }, [user]);

  // Load addresses & customer orders
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        setIsLoadingAddresses(true);
        const [addrList, orderList] = await Promise.all([
          storeApi.getAddresses().catch(() => []),
          storeApi.getOrders().catch(() => []),
        ]);
        setAddresses(addrList);
        if (orderList && Array.isArray(orderList)) {
          setOrdersCount(orderList.length);
        }
      } catch (err) {
        console.error('Failed to fetch addresses or orders:', err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Detect dirty profile form
  const isProfileDirty = useMemo(() => {
    if (!user) return false;
    return (
      fullName !== (user.fullName || '') ||
      phone !== (user.phone || '') ||
      bio !== (user.bio || '') ||
      title !== (user.title || '') ||
      dateOfBirth !== (user.dateOfBirth || '') ||
      preferredCurrency !== (user.preferredCurrency || 'USD') ||
      avatarUrl !== (user.avatarUrl || '') ||
      newsletterSubscribed !== (user.newsletterSubscribed ?? true) ||
      orderNotifications !== (user.orderNotifications ?? true) ||
      vipOffers !== (user.vipOffers ?? true) ||
      securityAlerts !== (user.securityAlerts ?? true)
    );
  }, [
    user,
    fullName,
    phone,
    bio,
    title,
    dateOfBirth,
    preferredCurrency,
    avatarUrl,
    newsletterSubscribed,
    orderNotifications,
    vipOffers,
    securityAlerts,
  ]);

  // Reset form to saved user data
  const handleResetProfile = () => {
    if (!user) return;
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
    setBio(user.bio || '');
    setTitle(user.title || '');
    setDateOfBirth(user.dateOfBirth || '');
    setPreferredCurrency(user.preferredCurrency || 'USD');
    setAvatarUrl(user.avatarUrl || '');
    setNewsletterSubscribed(user.newsletterSubscribed ?? true);
    setOrderNotifications(user.orderNotifications ?? true);
    setVipOffers(user.vipOffers ?? true);
    setSecurityAlerts(user.securityAlerts ?? true);
    showToast({
      type: 'info',
      title: 'Changes Discarded',
      message: 'Reverted all unsaved modifications to original profile.',
    });
  };

  // Upload Avatar File via /api/upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file (PNG, JPG, WEBP, or GIF).',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Image size must be smaller than 10MB.',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'online-store/avatars');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload profile picture');
      }

      setAvatarUrl(data.url);
      showToast({
        type: 'success',
        title: 'Profile Picture Ready',
        message: 'Image uploaded. Click "Save Changes" to apply.',
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Unable to upload image.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Drag and drop handlers for avatar area
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAvatarDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Save Complete Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Full name must contain at least 2 characters.',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const success = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        title: title.trim(),
        dateOfBirth: dateOfBirth.trim(),
        preferredCurrency,
        avatarUrl,
        newsletterSubscribed,
        orderNotifications,
        vipOffers,
        securityAlerts,
      });

      if (success) {
        showToast({
          type: 'success',
          title: 'Collector Profile Saved',
          message: 'All your changes have been securely updated.',
        });
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResendingVerification(true);
    try {
      await resendVerification(user.email);
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your current password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      showToast({
        type: 'error',
        title: 'Weak Password',
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Mismatch',
        message: 'New password and confirmation do not match.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed securely.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Password Change Failed',
        message: err instanceof Error ? err.message : 'Unable to change password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Open Address Modal for New / Edit
  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressFormData({
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || '',
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault || false,
      });
    } else {
      setEditingAddress(null);
      setAddressFormData({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        isDefault: addresses.length === 0,
      });
    }
    setShowAddressModal(true);
  };

  // Save Address Handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !addressFormData.fullName ||
      !addressFormData.phone ||
      !addressFormData.addressLine1 ||
      !addressFormData.city ||
      !addressFormData.state ||
      !addressFormData.postalCode ||
      !addressFormData.country
    ) {
      showToast({
        type: 'error',
        title: 'Incomplete Address',
        message: 'Please complete all required address fields.',
      });
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload: Partial<Address> & { id?: string } = {
        ...addressFormData,
        id: editingAddress ? editingAddress.id : undefined,
      };

      const saved = await storeApi.saveAddress(payload);

      if (editingAddress) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === saved.id ? saved : saved.isDefault ? { ...a, isDefault: false } : a))
        );
        showToast({
          type: 'success',
          title: 'Vault Address Updated',
          message: 'Delivery details have been updated.',
        });
      } else {
        setAddresses((prev) => (saved.isDefault ? [saved, ...prev.map((a) => ({ ...a, isDefault: false }))] : [...prev, saved]));
        showToast({
          type: 'success',
          title: 'Vault Address Added',
          message: 'New address added to your VIP Vault.',
        });
      }
      setShowAddressModal(false);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Address Error',
        message: err instanceof Error ? err.message : 'Unable to save address.',
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await storeApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast({
        type: 'info',
        title: 'Address Removed',
        message: 'The selected delivery address has been removed.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Unable to remove address. Please try again.',
      });
    }
  };

  // Set Address as Default
  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      const updated = await storeApi.saveAddress({ ...addr, isDefault: true });
      setAddresses((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, isDefault: true } : { ...a, isDefault: false }))
      );
      showToast({
        type: 'success',
        title: 'Primary Vault Set',
        message: `${addr.addressLine1} is now your default shipping vault.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Unable to set default address.',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 font-serif">
            Opening Collector Suite...
          </p>
        </div>
      </div>
    );
  }

  const memberId = user ? `LX-${user.id.slice(-6).toUpperCase()}` : 'LX-000000';
  const joinedDate = user?.createdAt ? formatDate(user.createdAt) : 'Charter Member';

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#070b12] pt-24 sm:pt-28 pb-28 text-slate-900 dark:text-slate-100 selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">

        {/* ========================================================================= */}
        {/* COMPACT LUXURY ATELIER HEADER BAR */}
        {/* ========================================================================= */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-[#0d1424] to-slate-950 border border-slate-800/80 shadow-2xl p-4 sm:p-6 lg:p-7 text-white">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

          {/* Monogram Hairline Pattern */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            {/* Left: Avatar & Identity Studio */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Compact Avatar with Ring */}
              <div
                className="relative group shrink-0 cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  setAvatarDragOver(true);
                }}
                onDragLeave={() => setAvatarDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                title="Click or drag to change portrait"
              >
                <div
                  className={cn(
                    'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 shadow-lg shadow-amber-500/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-amber-500/30',
                    avatarDragOver && 'scale-110 ring-4 ring-amber-400'
                  )}
                >
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 relative flex items-center justify-center border border-slate-950">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName || 'Collector Profile'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-700 via-amber-900 to-slate-950 flex flex-col items-center justify-center text-amber-200">
                        <span className="text-xl sm:text-2xl font-extrabold font-serif">
                          {fullName ? fullName[0].toUpperCase() : 'U'}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-amber-400 font-bold">
                          VIP
                        </span>
                      </div>
                    )}

                    {/* Hover Upload Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                      <Camera className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Photo</span>
                    </div>

                    {/* Uploading Spinner */}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-amber-400 backdrop-blur-xs">
                        <Loader2 className="w-5 h-5 animate-spin mb-1 text-amber-400" />
                        <span className="text-[9px] font-bold">Uploading</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Micro Camera Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md border border-amber-300 transition-transform duration-200 hover:scale-110"
                  aria-label="Upload profile picture"
                >
                  <Camera className="w-3 h-3 stroke-[2.5]" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Collector Name & Subtitle */}
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{user?.role === 'admin' ? 'Grand Administrator' : 'VIP Diamond Patron'}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono">
                    {memberId}
                  </span>

                  {user?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-semibold transition-colors"
                      title="Click to resend verification email"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>{isResendingVerification ? 'Sending...' : 'Verify'}</span>
                    </button>
                  )}
                </div>

                <h1 className="text-lg sm:text-2xl font-bold font-serif tracking-tight text-white truncate">
                  {fullName || 'Atelier Collector'}
                </h1>

                <p className="text-xs text-slate-300/90 font-medium truncate max-w-sm sm:max-w-md">
                  {title || 'Fine Horology & Haute Joaillerie Connoisseur'}
                </p>

                {/* Avatar Quick Switchers */}
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowPresetPicker(!showPresetPicker)}
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Preset Portraits</span>
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-slate-300 hover:text-white underline underline-offset-2 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Image URL</span>
                  </button>
                  {avatarUrl && (
                    <>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl('');
                          showToast({
                            type: 'info',
                            title: 'Avatar Reset',
                            message: 'Portrait cleared. Click Save to finalize.',
                          });
                        }}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5 self-start md:self-center shrink-0">
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="gold"
                    size="sm"
                    leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                    className="shadow-sm shadow-amber-500/20 text-xs"
                  >
                    Admin Portal
                  </Button>
                </Link>
              )}

              <Link href="/account/orders">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Package className="w-3.5 h-3.5 text-amber-500" />}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                >
                  Orders ({ordersCount})
                </Button>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Sign out of Atelier Suite"
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Collapsible Portrait Drawer */}
          <AnimatePresence>
            {showPresetPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-200">
                    Choose an Atelier Portrait Preset:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPresetPicker(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(preset.url);
                        setShowPresetPicker(false);
                        showToast({
                          type: 'success',
                          title: `${preset.name} Selected`,
                          message: 'Click "Save Profile" to apply.',
                        });
                      }}
                      className={cn(
                        'group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200',
                        avatarUrl === preset.url
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                          : 'border-white/15 hover:border-amber-400/70 hover:scale-105'
                      )}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      {avatarUrl === preset.url && (
                        <div className="absolute inset-0 bg-amber-500/40 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {showUrlInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <div className="flex gap-2 max-w-md">
                  <input
                    type="url"
                    placeholder="https://example.com/portrait.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      if (customUrl.trim().startsWith('http')) {
                        setAvatarUrl(customUrl.trim());
                        setShowUrlInput(false);
                        setCustomUrl('');
                        showToast({
                          type: 'success',
                          title: 'Custom URL Set',
                          message: 'Click "Save Profile" to finalize.',
                        });
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Invalid URL',
                          message: 'Must begin with http:// or https://',
                        });
                      }
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlInput(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE SMALL-SIZE METRICS & ACTIVITY CARDS (6 CARDS GRID) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {/* Card 1: Orders */}
          <Link
            href="/account/orders"
            className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Orders
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {ordersCount}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold group-hover:underline flex items-center">
                  Track <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                Acquisitions
              </p>
            </div>
          </Link>

          {/* Card 2: Wishlist / Saved Pieces */}
          <Link
            href="/wishlist"
            className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-rose-500/40 dark:hover:border-rose-500/40 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Wishlist
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {wishlistCount}
                </span>
                <span className="text-[10px] text-rose-500 font-semibold group-hover:underline flex items-center">
                  Saved <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                Curated pieces
              </p>
            </div>
          </Link>

          {/* Card 3: Vault Addresses */}
          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className="text-left group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-500/40 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Vaults
              </span>
              <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {addresses.length}
                </span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold group-hover:underline flex items-center">
                  Manage <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                Delivery locations
              </p>
            </div>
          </button>

          {/* Card 4: VIP Tier */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                VIP Tier
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm sm:text-base font-bold font-serif text-amber-600 dark:text-amber-400 truncate">
                  Tier 1
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  Gold
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                Diamond Patron
              </p>
            </div>
          </div>

          {/* Card 5: Vault Security */}
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className="text-left group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Security
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm sm:text-base font-bold font-serif text-emerald-600 dark:text-emerald-400 truncate">
                  256-bit
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline flex items-center">
                  Check <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                Vault protected
              </p>
            </div>
          </button>

          {/* Card 6: Concierge Line */}
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className="text-left group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Concierge
              </span>
              <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm sm:text-base font-bold font-serif text-purple-600 dark:text-purple-400 truncate">
                  Priority
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold group-hover:underline flex items-center">
                  Desk <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                24/7 Dedicated
              </p>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE SEGMENTED TABS CONTROLLER */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#0d1322] rounded-2xl p-1.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0',
              activeTab === 'profile'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Identity</span>
            {isProfileDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={cn(
              'flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0',
              activeTab === 'addresses'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            )}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Vault Addresses</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeTab === 'addresses'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
              )}
            >
              {addresses.length}
            </span>
          </button>

          <Link
            href="/account/orders"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 whitespace-nowrap shrink-0"
          >
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span>Order History</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0',
              activeTab === 'security'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            )}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security & Passphrase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={cn(
              'flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0',
              activeTab === 'preferences'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            )}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>VIP Preferences</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT SECTIONS (STRUCTURED WITH SLEEK SMALL-SIZE CARDS) */}
        {/* ========================================================================= */}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 1: PROFILE & ATELIER IDENTITY */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
              {/* Responsive Grid of Small Size Form Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Card 1: Collector Legal Identity */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Legal & Title
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Atelier member identification
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      label="Full Legal / Display Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Lord Alexander Sterling"
                      required
                    />

                    <Input
                      label="VIP Title / Headline"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Fine Horology Connoisseur"
                    />
                  </div>
                </div>

                {/* Card 2: Direct Contact & Verification */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Contact Details
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Vault courier & dispatch links
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          VIP Email
                        </label>
                        {user?.emailVerified ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pending</span>
                        )}
                      </div>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-slate-100/70 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs cursor-not-allowed shadow-inner"
                      />
                    </div>

                    <Input
                      label="Direct Phone (Vault Dispatch)"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                    />
                  </div>
                </div>

                {/* Card 3: Valuation & Private Dates */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Currency & Calendar
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Catalogue & salon curations
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Valuation Currency
                      </label>
                      <select
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B101E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm"
                      >
                        <option value="USD">USD ($) — United States Dollar</option>
                        <option value="EUR">EUR (€) — Euro</option>
                        <option value="GBP">GBP (£) — British Pound</option>
                        <option value="AED">AED (د.إ) — UAE Dirham</option>
                        <option value="CHF">CHF (Fr) — Swiss Franc</option>
                        <option value="JPY">JPY (¥) — Japanese Yen</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Anniversary / Birthday
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B101E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 4: Collector Biography & Notes (Spans 2 columns on lg) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5 lg:col-span-2">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Collector Biography & Bespoke Notes
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Horology preferences, ring dimensions, or gemstone requests
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{bio.length}/500</span>
                  </div>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your collection interests, wrist sizing, ring specifications, or favorite horological complications..."
                    className="w-full bg-white dark:bg-[#0B101E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm leading-relaxed"
                  />
                </div>

                {/* Card 5: Atelier Privileges Overview (1 col on lg) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 dark:border-amber-400/20 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      <span>Patron Privileges</span>
                    </div>
                    <div className="mt-2.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Insured armored courier vault delivery</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Private salon preview invitations</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Dedicated master horologist advisor</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Charter Member</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  {isProfileDirty ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Unsaved changes awaiting confirmation
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Profile information is up to date
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {isProfileDirty && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetProfile}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Discard
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    size="sm"
                    isLoading={isSavingProfile}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="shadow-sm shadow-amber-500/20"
                  >
                    Save Profile Changes
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 2: VAULT & SHIPPING ADDRESSES */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'addresses' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif">
                  Registered Vault Destinations
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Armored courier and insured delivery destinations for acquisitions.
                </p>
              </div>
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => openAddressModal()}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Vault Address
              </Button>
            </div>

            {/* Address Small Cards Grid */}
            {isLoadingAddresses ? (
              <div className="p-12 text-center bg-white dark:bg-[#0d1322] rounded-2xl border border-slate-200/80 dark:border-white/10">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-500 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading registered vault destinations...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Registered Address Cards */}
                {addresses.map((addr) => (
                  <div
                    key={addr.id || addr.addressLine1}
                    className={cn(
                      'p-4 rounded-2xl bg-white dark:bg-[#0d1322] border transition-all duration-200 flex flex-col justify-between space-y-3 relative group',
                      addr.isDefault
                        ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 shadow-md'
                        : 'border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20'
                    )}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {addr.fullName}
                          </span>
                        </div>

                        {addr.isDefault ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Primary Vault
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr)}
                            className="text-[10px] font-semibold text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                      </div>

                      {/* Address Lines */}
                      <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {addr.addressLine1}
                        </p>
                        {addr.addressLine2 && (
                          <p className="text-slate-500 dark:text-slate-400 truncate">
                            {addr.addressLine2}
                          </p>
                        )}
                        <p className="text-slate-500 dark:text-slate-400">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {addr.country}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{addr.phone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => openAddressModal(addr)}
                        className="font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-[11px]"
                      >
                        Edit Details
                      </button>

                      {addr.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <Trash className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add New Vault Address Card */}
                <button
                  type="button"
                  onClick={() => openAddressModal()}
                  className="min-h-[160px] p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-500/5 transition-all duration-200 flex flex-col items-center justify-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Register New Vault
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Residence, office, or private depository
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 3: SECURITY & PASSPHRASE */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Card 1: Change Passphrase */}
              <form
                onSubmit={handleChangePassword}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5"
              >
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Update Passphrase
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Protect your collector vault with a strong secret
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-white dark:bg-[#0B101E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs pr-9 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      New Passphrase (Min 6 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-white dark:bg-[#0B101E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs pr-9 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Confirm New Passphrase
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-white dark:bg-[#0B101E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs pr-9 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="gold"
                    size="sm"
                    isLoading={isChangingPassword}
                    leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                  >
                    Update Password
                  </Button>
                </div>
              </form>

              {/* Card 2: Cryptographic Security & 2FA Status */}
              <div className="space-y-3.5">
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Cryptographic Session
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Active transport layer encryption
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Encryption Cipher</span>
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">AES-256-GCM</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Session Authentication</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Secure JWT Token
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Email Verification</span>
                      {user?.emailVerified ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Confirmed</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                          className="text-amber-600 dark:text-amber-400 font-semibold underline"
                        >
                          Verify Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Security Best Practices */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Vault Security Recommendations</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Always access your Atelier account from secure devices. Luxe Atelier staff will never ask for your password or SMS verification codes.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 4: VIP CONCIERGE & NOTIFICATION PREFERENCES */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* 4 Small Cards Grid for Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Preference Card 1: Private Salon */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Private Salon & Secret Releases</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Receive confidential early access 24 hours prior to public catalogue drops.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={vipOffers}
                  onChange={(e) => setVipOffers(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Preference Card 2: Courier Tracking */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Package className="w-3.5 h-3.5 text-sky-500" />
                    <span>White-Glove Courier Updates</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Instant SMS & email telemetry when orders are dispatched from the vault.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={orderNotifications}
                  onChange={(e) => setOrderNotifications(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Preference Card 3: Horological Journal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Atelier Monthly Journal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Curated essays covering heritage watchmakers and rare gemstone origins.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newsletterSubscribed}
                  onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Preference Card 4: Security Alerts */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Instant Security Alerts</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Immediate notification if an unrecognized browser attempts login.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securityAlerts}
                  onChange={(e) => setSecurityAlerts(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Concierge Direct Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 dark:border-amber-400/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>VIP Private Concierge Liaison</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Direct line for private commissions, vault tours, and custom horological sourcing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="mailto:concierge@luxeatelier.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Concierge</span>
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveProfile()}
                  isLoading={isSavingProfile}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING COMPACT UNSAVED CHANGES DOCK */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isProfileDirty && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3"
          >
            <div className="bg-slate-950/90 dark:bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div className="text-xs truncate">
                  <p className="font-bold text-white truncate">Unsaved Modifications</p>
                  <p className="text-slate-400 text-[10px]">Changes ready to save</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetProfile}
                  className="text-slate-300 hover:text-white hover:bg-white/10 text-xs h-7 px-2.5"
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  onClick={() => handleSaveProfile()}
                  isLoading={isSavingProfile}
                  leftIcon={<Save className="w-3 h-3" />}
                  className="shadow-sm shadow-amber-500/30 text-xs h-7 px-3"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT VAULT ADDRESS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg bg-white dark:bg-[#0d1322] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-serif">
                  {editingAddress ? 'Update Vault Destination' : 'Register New Vault Destination'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Recipient Full Name"
                    value={addressFormData.fullName}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, fullName: e.target.value })
                    }
                    placeholder="e.g. Alexander Sterling"
                    required
                  />

                  <Input
                    label="Contact Telephone"
                    value={addressFormData.phone}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>

                <Input
                  label="Street Address (Line 1)"
                  value={addressFormData.addressLine1}
                  onChange={(e) =>
                    setAddressFormData({ ...addressFormData, addressLine1: e.target.value })
                  }
                  placeholder="e.g. 740 Park Avenue"
                  required
                />

                <Input
                  label="Apartment, Suite, or Vault Unit (Optional)"
                  value={addressFormData.addressLine2}
                  onChange={(e) =>
                    setAddressFormData({ ...addressFormData, addressLine2: e.target.value })
                  }
                  placeholder="Apt 14B / Vault Unit 3"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Input
                    label="City"
                    value={addressFormData.city}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, city: e.target.value })
                    }
                    placeholder="New York"
                    required
                  />

                  <Input
                    label="State"
                    value={addressFormData.state}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, state: e.target.value })
                    }
                    placeholder="NY"
                    required
                  />

                  <Input
                    label="Postal Code"
                    value={addressFormData.postalCode}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, postalCode: e.target.value })
                    }
                    placeholder="10021"
                    required
                  />

                  <Input
                    label="Country"
                    value={addressFormData.country}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, country: e.target.value })
                    }
                    placeholder="United States"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressFormData.isDefault}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Set as primary shipping vault
                  </span>
                </label>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddressModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    size="sm"
                    isLoading={isSavingAddress}
                  >
                    {editingAddress ? 'Save Changes' : 'Register Address'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

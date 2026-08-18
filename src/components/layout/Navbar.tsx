'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  Menu,
  X,
  Crown,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/data/initial-data';
import { formatPrice, cn } from '@/lib/utils';
import Image from 'next/image';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsMobileMenuOpen(false);
      setIsSearchOpen(false);
      setIsUserMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Shop All', href: '/shop' },
    { label: 'Timepieces', href: '/shop?category=timepieces' },
    { label: 'Acoustics', href: '/shop?category=audio-tech' },
    { label: 'Leather Goods', href: '/shop?category=leather-goods' },
    { label: 'New Arrivals', href: '/shop?badge=NEW' },
    { label: 'Deals', href: '/shop?badge=SALE' },
  ];

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? INITIAL_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-40 border-b transition-all duration-300 ease-out',
          isScrolled
            ? 'glass-navbar py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl border-white/10'
            : 'bg-[#080b12]/86 py-3.5 backdrop-blur-md border-white/[0.07]'
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Left: Mobile Menu & Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-2.5 text-gray-300 hover:text-gold-400 rounded-xl hover:bg-white/5 transition-all duration-200"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="relative flex items-center gap-2.5 group py-1" aria-label="Luxe Atelier Home">
              <div className="w-9 h-9 rounded-[10px] border border-gold-400/60 bg-gradient-to-br from-gold-400/20 via-[#161719] to-black p-0.5 shadow-[0_0_0_1px_rgba(245,184,0,0.08)] transition-all duration-300 group-hover:border-gold-300 group-hover:shadow-[0_0_18px_rgba(245,184,0,0.2)]">
                <div className="w-full h-full bg-[#0b0e15] rounded-[8px] flex items-center justify-center">
                  <Crown className="w-4 h-4 text-gold-400 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.6} />
                </div>
              </div>
              <span className="leading-none uppercase font-display whitespace-nowrap">
                <span className="block text-[17px] font-extrabold tracking-[0.13em] text-white">LUXE <span className="font-medium text-gold-400">ATELIER</span></span>
                <span className="block mt-1 text-[8px] font-bold tracking-[0.33em] text-gold-400/90">HOME</span>
              </span>
              <span className="absolute bottom-0 left-0 h-px w-[43px] origin-left bg-gradient-to-r from-gold-400 to-transparent transition-transform duration-300 group-hover:scale-x-125" />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden xl:flex flex-1 items-center justify-center gap-4 2xl:gap-7" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const isActive = pathname === '/shop' && link.href === '/shop';
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'group relative py-2 text-[10px] 2xl:text-[11px] font-bold uppercase tracking-[0.12em] text-center leading-tight transition-colors duration-200 hover:text-gold-400',
                    isActive ? 'text-gold-400' : 'text-gray-300'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 inset-x-1 h-px bg-gradient-to-r from-gold-500 to-amber-300 rounded-full"
                    />
                  )}
                  {!isActive && <span className="absolute bottom-0 inset-x-1 h-px origin-left scale-x-0 bg-gold-400 transition-transform duration-300 group-hover:scale-x-100" />}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions (Search, Wishlist, Cart, Account, Admin Pill) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-gray-300 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all duration-200 flex items-center gap-2 group"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden 2xl:inline text-xs text-gray-400 group-hover:text-gray-200">Search catalog...</span>
            </button>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="group relative p-2.5 text-gray-300 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all duration-200"
              aria-label="View saved items"
            >
              <Heart className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-gray-300 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all duration-200 flex items-center gap-2 group"
              aria-label="Open shopping bag"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 group-hover:text-gold-400 transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-gold-500 text-black text-[10px] font-extrabold flex items-center justify-center shadow-md shadow-gold-500/50">
                    {itemCount}
                  </span>
                )}
              </div>
            </button>

            {/* User Account / Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#121722]/85 hover:bg-[#19202d] border border-white/10 hover:border-gold-400/35 text-xs font-semibold text-gray-200 shadow-sm transition-all duration-200"
              >
                <User className="w-4 h-4 text-gold-400" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {user ? user.fullName.split(' ')[0] : 'Sign In'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel bg-surface-200 border border-border-light shadow-2xl p-3 z-50 space-y-2"
                  >
                    {user ? (
                      <div>
                        <div className="px-3 py-2 border-b border-border-subtle mb-2">
                          <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                          <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/20">
                            {user.role}
                          </span>
                        </div>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gold-400 hover:bg-gold-500/10 rounded-xl transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Admin Portal</span>
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>My Account</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>My Orders & Tracking</span>
                        </Link>

                        <div className="pt-2 border-t border-border-subtle mt-2">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 space-y-2 text-center">
                        <p className="text-xs text-gray-300 font-medium">Collector Access</p>
                        <button
                          onClick={() => {
                            setAuthModalMode('login');
                            setIsAuthModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => {
                            setAuthModalMode('register');
                            setIsAuthModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-surface-50 text-gold-400 border border-gold-500/30 text-xs font-bold hover:bg-gold-500/10 transition-colors"
                        >
                          Create Account
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Global Interactive Search Overlay Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="relative w-full max-w-2xl bg-surface-200 border border-border-light rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="p-4 border-b border-border-light flex items-center gap-3">
                <Search className="w-5 h-5 text-gold-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search timepieces, acoustic monitors, leather bags, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm font-medium focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2.5 py-1 text-xs text-gray-400 hover:text-white rounded-lg bg-surface-100"
                >
                  ESC
                </button>
              </form>

              {/* Instant Results or Quick Collections */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {searchQuery.trim() ? (
                  searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2">
                        Products ({searchResults.length})
                      </p>
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-surface-100/80 transition-colors group"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-100 shrink-0 border border-white/5">
                            <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-white group-hover:text-gold-400 transition-colors truncate">
                              {product.title}
                            </h4>
                            <p className="text-[11px] text-gray-400">
                              {product.brandName} • {product.categoryName}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-white shrink-0">
                            {formatPrice(product.price)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      No matching luxury pieces found for &quot;{searchQuery}&quot;.
                    </div>
                  )
                ) : (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Trending Collections
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {INITIAL_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            router.push(`/shop?category=${cat.slug}`);
                            setIsSearchOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border-light text-xs text-gray-300 hover:text-white transition-colors"
                        >
                          {cat.name}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          router.push('/shop?badge=BEST+SELLER');
                          setIsSearchOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs text-gold-400"
                      >
                        Best Sellers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-surface-200 border-r border-border-light shadow-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-border-light">
                  <span className="leading-none uppercase font-display">
                    <span className="block text-lg font-extrabold tracking-[0.12em] text-white">LUXE <span className="font-medium text-gold-400">ATELIER</span></span>
                    <span className="block mt-1 text-[8px] font-bold tracking-[0.32em] text-gold-400/90">HOME</span>
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-6 space-y-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-gold-400 py-2 border-b border-white/5"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-semibold uppercase tracking-wider text-gold-400 py-2"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </nav>
              </div>

              <div className="pt-6 border-t border-border-light space-y-2">
                {!user ? (
                  <>
                    <p className="text-xs text-gray-400">Collector Access</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAuthModalMode('login');
                          setIsAuthModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2 rounded-xl bg-surface-100 text-xs font-semibold text-gray-200"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setAuthModalMode('register');
                          setIsAuthModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs font-semibold text-gold-400"
                      >
                        Register
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

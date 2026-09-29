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
  ShieldCheck,
  Package,
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
  const isEffectiveAdmin = isAdmin || user?.role === 'admin' || user?.email?.toLowerCase() === 'gb8585438@gmail.com';

  if (pathname?.startsWith('/admin')) {
    return null;
  }

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
      setIsScrolled(window.scrollY > 15);
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
      ).slice(0, 5)
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
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-[11px] font-medium tracking-wider uppercase py-2 px-4 text-center border-b border-slate-800">
        <span className="opacity-90">
          Complimentary Global Express Delivery on orders over $500 • 100% Certified Authentic
        </span>
      </div>

      {/* Main Sticky Header */}
      <header
        className={cn(
          'sticky top-0 inset-x-0 z-40 transition-all duration-300 ease-out bg-white/95 backdrop-blur-md border-b border-slate-200/80',
          isScrolled ? 'py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]' : 'py-3.5'
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group py-1" aria-label="Luxe Atelier Home">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-50 to-amber-100 p-0.5 shadow-sm transition-all duration-300 group-hover:border-amber-500 group-hover:shadow-md">
                <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-600 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.8} />
                </div>
              </div>
              <span className="leading-none uppercase font-display whitespace-nowrap">
                <span className="block text-base sm:text-[17px] font-extrabold tracking-[0.14em] text-slate-900">
                  LUXE <span className="font-semibold text-amber-600">ATELIER</span>
                </span>
                <span className="block mt-0.5 text-[8px] font-bold tracking-[0.32em] text-slate-400">
                  CURATED STORE
                </span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden xl:flex flex-1 items-center justify-center gap-6 2xl:gap-8" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const isActive =
                (pathname === '/shop' && link.href === '/shop') ||
                (link.href.includes('?') && pathname === '/shop' && typeof window !== 'undefined' && window.location.search.includes(link.href.split('?')[1]));

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'group relative py-2 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors duration-200',
                    isActive ? 'text-amber-700' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-600 rounded-full"
                    />
                  )}
                  {!isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 origin-left scale-x-0 bg-amber-600 transition-transform duration-300 group-hover:scale-x-100" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions (Search, Wishlist, Cart, Account, Admin Link) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 flex items-center gap-2 group"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden 2xl:inline text-xs text-slate-400 group-hover:text-slate-600">Search pieces...</span>
            </button>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="group relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
              aria-label="View saved items"
            >
              <Heart className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 flex items-center gap-2 group"
              aria-label="Open shopping bag"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                    {itemCount}
                  </span>
                )}
              </div>
            </button>

            {/* User Account / Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 shadow-sm transition-all duration-200"
              >
                <User className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline max-w-[90px] truncate font-medium">
                  {user ? user.fullName.split(' ')[0] : 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 space-y-2 text-slate-800"
                  >
                    {user ? (
                      <div>
                        <div className="px-3 py-2 border-b border-slate-100 mb-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          {isEffectiveAdmin ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              ADMIN
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {user.role}
                            </span>
                          )}
                        </div>

                        {isEffectiveAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50/90 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200/80 mb-1"
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-700" />
                            <span>Admin Portal</span>
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>My Account</span>
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-500" />
                          <span>My Orders & Tracking</span>
                        </Link>

                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 space-y-2 text-center">
                        <p className="text-xs text-slate-600 font-medium">Collector Access</p>
                        <button
                          onClick={() => {
                            setAuthModalMode('login');
                            setIsAuthModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => {
                            setAuthModalMode('register');
                            setIsAuthModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-slate-50 text-amber-800 border border-amber-300/80 text-xs font-bold hover:bg-amber-50 transition-colors"
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
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-900"
            >
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="p-4 border-b border-slate-200 flex items-center gap-3">
                <Search className="w-5 h-5 text-amber-600 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search timepieces, acoustic monitors, leather bags, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 rounded-lg bg-slate-100 font-medium"
                >
                  ESC
                </button>
              </form>

              {/* Instant Results or Quick Collections */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {searchQuery.trim() ? (
                  searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
                        Matching Pieces ({searchResults.length})
                      </p>
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                              {product.title}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {product.brandName} • {product.categoryName}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-slate-900 shrink-0">
                            {formatPrice(product.price)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No matching luxury pieces found for &quot;{searchQuery}&quot;.
                    </div>
                  )
                ) : (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
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
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 transition-colors font-medium"
                        >
                          {cat.name}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          router.push('/shop?badge=BEST+SELLER');
                          setIsSearchOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold"
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
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white border-r border-slate-200 shadow-2xl p-6 flex flex-col justify-between text-slate-900"
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <span className="leading-none uppercase font-display">
                    <span className="block text-base font-extrabold tracking-[0.14em] text-slate-900">
                      LUXE <span className="font-semibold text-amber-600">ATELIER</span>
                    </span>
                    <span className="block mt-0.5 text-[8px] font-bold tracking-[0.32em] text-slate-400">
                      CURATED STORE
                    </span>
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-6 space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-semibold uppercase tracking-wider text-slate-700 hover:text-amber-700 py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isEffectiveAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-semibold uppercase tracking-wider text-amber-800 py-2.5 px-2 rounded-lg bg-amber-50"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </nav>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                {!user ? (
                  <>
                    <p className="text-xs text-slate-500 font-medium">Collector Access</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAuthModalMode('login');
                          setIsAuthModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setAuthModalMode('register');
                          setIsAuthModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
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
                    className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700"
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

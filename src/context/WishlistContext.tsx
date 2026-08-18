'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { authHeaders } from '@/lib/api/store-client';

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/wishlist', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load wishlist');
      setWishlist(data.data || []);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Wishlist',
        message: error instanceof Error ? error.message : 'Unable to load wishlist',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (authLoading) return;
    loadWishlist();
  }, [authLoading, loadWishlist]);

  const isInWishlist = (productId: string) => wishlist.some((item) => item.id === productId);

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      showToast({
        type: 'warning',
        title: 'Sign in required',
        message: 'Please sign in to save items to your wishlist.',
      });
      return;
    }
    const exists = isInWishlist(product.id);
    setPendingId(product.id);
    setWishlist((prev) => (exists ? prev.filter((item) => item.id !== product.id) : [...prev, product]));
    try {
      showToast({
        type: 'info',
        title: exists ? 'Removing...' : 'Adding to wishlist...',
        message: exists ? `Removing ${product.title}` : `Saving ${product.title}`,
      });
      const res = exists
        ? await fetch(`/api/wishlist/${encodeURIComponent(product.id)}`, { method: 'DELETE', headers: authHeaders() })
        : await fetch('/api/wishlist', {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({ productId: product.id }),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save wishlist');
      showToast({
        type: exists ? 'info' : 'success',
        title: exists ? 'Removed from Wishlist' : 'Added to wishlist',
        message: exists ? `${product.title} removed from your saved items.` : `${product.title} added to your personal curation.`,
      });
    } catch (error) {
      setWishlist((prev) => (exists ? [...prev, product] : prev.filter((item) => item.id !== product.id)));
      showToast({
        type: 'error',
        title: 'Unable to save wishlist',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setPendingId(null);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated) return;
    const removed = wishlist.find((item) => item.id === productId);
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    try {
      const res = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Unable to save wishlist');
    } catch {
      if (removed) setWishlist((prev) => [...prev, removed]);
      showToast({ type: 'error', title: 'Unable to save wishlist', message: 'Please try again.' });
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    const previous = wishlist;
    setWishlist([]);
    try {
      const res = await fetch('/api/wishlist', { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Unable to save wishlist');
    } catch {
      setWishlist(previous);
      showToast({ type: 'error', title: 'Unable to save wishlist', message: 'Please try again.' });
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isLoading: isLoading || Boolean(pendingId),
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};

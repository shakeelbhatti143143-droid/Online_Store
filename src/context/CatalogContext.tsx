'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Product, Category, Brand } from '@/types';
import { storeApi } from '@/lib/api/store-client';

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [p, c, b] = await Promise.all([
        storeApi.getProducts(),
        storeApi.getCategories(),
        storeApi.getBrands().catch(() => []),
      ]);
      setProducts(p);
      setCategories(c);
      setBrands(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load catalog');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CatalogContext.Provider value={{ products, categories, brands, isLoading, error, refresh }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within CatalogProvider');
  return context;
};

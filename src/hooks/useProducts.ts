import { useState, useEffect } from 'react';
import { getCategories, getProducts } from '@/lib/firestore';
import type { Category, Product } from '@/types';

interface UseProductsResult {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches all categories (sorted by `ordre`) and all products
 * (sorted within each category by orderCount desc).
 */
export function useProducts(): UseProductsResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        if (cancelled) return;

        // Categories are already ordered by `ordre` from Firestore query
        setCategories(cats);

        // Products are already sorted by orderCount desc from Firestore query
        setProducts(prods);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, products, loading, error };
}

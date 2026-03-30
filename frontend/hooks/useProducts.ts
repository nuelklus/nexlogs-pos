'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient, Product, ProductDetail, SearchFilters, ProductsResponse, CategoryFallback } from '@/lib/api';
import { useCache } from './useCache';

interface UseProductsOptions {
  immediate?: boolean;
  filters?: SearchFilters;
}

// Memoized data transformation
const transformProduct = (product: any) => {
  // Handle image_url from Django Product model
  let imageUrl = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Product'; // Default fallback
  
  if (product.image_url) {
    // Check if it's a relative path (doesn't start with http)
    if (product.image_url.startsWith('/')) {
      // Prepend Django media URL for relative paths
      imageUrl = `https://hardware-ecommerce-monorepo.onrender.com${product.image_url}`;
    } else {
      // Use full URL as-is
      imageUrl = product.image_url;
    }
  }
  
  return {
    id: product.id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.short_description,
    price: parseFloat(product.price),
    originalPrice: product.compare_price ? parseFloat(product.compare_price) : undefined,
    image: imageUrl, // Use processed image_url
    category: product.category?.name || 'Unknown',
    brand: product.brand?.name || 'Unknown',
    rating: product.average_rating || 4.5,
    reviewCount: product.reviews?.length || 0,
    technicalSpecs: product.specifications?.map((spec: any) => ({
      label: spec.label,
      value: spec.value,
      type: spec.spec_type || 'other'
    })) || [],
    stockStatus: product.stock_status?.status === 'in_stock' ? 'in_stock' : 
                product.stock_status?.status === 'low_stock' ? 'low_stock' : 'out_of_stock' as const,
    warehouse: 'Tema',
    sku: product.sku,
  };
};

export function useProducts(options: UseProductsOptions = {}) {
  const { immediate = false, filters: externalFilters = {} } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFallback, setCategoryFallback] = useState<CategoryFallback | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [filters, setFilters] = useState<SearchFilters>(externalFilters);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create cache key based on filters
  const cacheKey = useMemo(() => 
    `products_${JSON.stringify(externalFilters)}_${JSON.stringify({ page: 1 })}`,
    [externalFilters]
  );

  // Use cache for products
  const { data: cachedData, loading: cacheLoading, error: cacheError, invalidate } = useCache(
    cacheKey,
    () => apiClient.getProducts({ ...externalFilters, page: 1, page_size: 12 }),
    3 * 60 * 1000 // 3 minutes cache
  );

  useEffect(() => {
    if (cachedData && !cacheLoading && !cacheError) {
      const products = cachedData.results || [];
      const count = cachedData.count || products.length;
      const nextPage = cachedData.next;
      const previousPage = cachedData.previous;
      
      // Transform the products
      const transformedProducts = products.map(transformProduct) as Product[];
      setProducts(transformedProducts);
      
      // Update pagination info from DRF response
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil(count / 12) || 1,
        totalCount: count,
        hasNext: !!nextPage,
        hasPrevious: !!previousPage,
      });
      
      // Set category fallback information if present
      if (cachedData.category_fallback) {
        setCategoryFallback(cachedData.category_fallback);
      } else {
        setCategoryFallback(null);
      }
      
      setLoading(false);
      setError(null);
    } else if (cacheLoading) {
      setLoading(true);
      setError(null);
    } else if (cacheError) {
      setLoading(false);
      setError(cacheError);
    }
  }, [cachedData, cacheLoading, cacheError]);

  const fetchProducts = useCallback(async (newFilters?: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);
    setCategoryFallback(null);
    
    // Add small delay to ensure loading state is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const filtersWithPagination = {
        ...newFilters,
        ...filters,
        page: page,
        page_size: 12, // 12 products per page
      };
      
      console.log('🔍 Fetching products with filters:', filtersWithPagination);
      const response: ProductsResponse = await apiClient.getProducts(filtersWithPagination);
      
      console.log('📦 Full API response:', response);
      console.log('🏷️ Category fallback in response:', response.category_fallback);
      
      // Handle Django REST Framework pagination response
      const products = response.results || [];
      const count = response.count || products.length;
      const nextPage = response.next;
      const previousPage = response.previous;
      
      // Transform the products
      const transformedProducts = products.map(transformProduct) as Product[];
      
      // Always replace products, don't append
      setProducts(transformedProducts);
      
      // Update pagination info from DRF response
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(count / 12) || 1,
        totalCount: count,
        hasNext: !!nextPage,
        hasPrevious: !!previousPage,
      });
      
      // Set category fallback information if present
      if (response.category_fallback) {
        console.log('🔄 Setting category fallback:', response.category_fallback);
        setCategoryFallback(response.category_fallback);
      } else {
        console.log('🧹 Clearing category fallback - none in response');
        setCategoryFallback(null);
      }
      
      console.log('✅ Loaded products:', transformedProducts.length, 'items');
      console.log('📊 Pagination info:', { count, nextPage, previousPage });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadPage = useCallback((page: number) => {
    fetchProducts(filters, page);
  }, [fetchProducts, filters]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery: string, searchFilters: SearchFilters = {}) => {
      // Clear existing timeout if any
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchProducts({ ...searchFilters, search: searchQuery });
      }, 300); // 300ms delay
    },
    [fetchProducts]
  );

  useEffect(() => {
    if (immediate) {
      fetchProducts();
    }
  }, [immediate, fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    categoryFallback,
    refetch: fetchProducts,
    loadPage,
    debouncedSearch,
  };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getProductBySlug(slug);
      console.log('🔍 Raw product data from API:', data);
      console.log('🔍 product.image_url:', (data as any).image_url);
      console.log('🔍 product.primary_image:', (data as any).primary_image);
      
      // Transform product data to match our frontend structure
      const transformedProduct = {
        ...data,
        image: (data as any).image_url || (data as any).primary_image?.image || 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Product',
        price: parseFloat(data.price.toString()),
        originalPrice: (data as any).compare_price ? parseFloat((data as any).compare_price.toString()) : undefined,
        category: typeof data.category === 'string' ? data.category : (data as any).category?.name || 'Unknown',
        categoryId: typeof data.category === 'string' ? undefined : (data as any).category?.id,
        categorySlug: typeof data.category === 'string' ? undefined : (data as any).category?.slug,
        brand: typeof data.brand === 'string' ? data.brand : (data as any).brand?.name || 'Unknown',
        brandId: typeof data.brand === 'string' ? undefined : (data as any).brand?.id,
        brandSlug: typeof data.brand === 'string' ? undefined : (data as any).brand?.slug,
        rating: (data as any).average_rating || 4.5,
        reviewCount: (data as any).reviews?.length || 0,
        stockStatus: (data as any).stock_status?.status === 'in_stock' ? 'in_stock' : 
                    (data as any).stock_status?.status === 'low_stock' ? 'low_stock' : 'out_of_stock' as const,
        technicalSpecs: (data as any).specifications?.map((spec: any) => ({
          label: spec.label,
          value: spec.value,
          type: spec.spec_type || 'other'
        })) || [],
        warehouse: {
          id: "1",
          name: "Tema Warehouse", 
          location: "Tema",
          phone: "+233 24 123 4567"
        }
      };
      
      console.log('🔍 Transformed product image:', transformedProduct.image);
      setProduct(transformedProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

export function useInitialData() {
  const [data, setData] = useState<{
    featured_products: Product[];
    categories: any[];
    brands: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const initialData = await apiClient.getInitialData();
      setData(initialData);
      console.log('✅ Real API data loaded:', initialData.featured_products.length, 'products');
    } catch (err) {
      console.warn('Failed to fetch initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    loading,
    error,
    refetch: fetchInitialData,
  };
}

export function useFeaturedProducts() {
  console.log('=== useFeaturedProducts HOOK START ===');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('=== State initialized ===');

  const fetchFeaturedProducts = useCallback(async () => {
    console.log('=== FETCH STARTED ===');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching featured products from API...');
      const data = await apiClient.getFeaturedProducts();
      console.log('Got featured products:', data);
      setProducts(data);
      
    } catch (err) {
      console.error('=== ERROR IN FETCH ===', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
    } finally {
      console.log('=== FETCH FINISHED ===');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('useFeaturedProducts hook mounted');
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  console.log('=== HOOK RETURNING ===');
  return {
    products,
    loading,
    error,
    refetch: fetchFeaturedProducts,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

export function useBrands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getBrands();
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    error,
    refetch: fetchBrands,
  };
}

export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<any>({
    products: [],
    categories: [],
    brands: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions({ products: [], categories: [], brands: [] });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getSearchSuggestions(query);
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
  };
}

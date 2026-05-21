'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { useInitialData } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { 
  Wrench, 
  Truck, 
  Shield, 
  Clock,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  CheckCircle
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';

const HardwareCard = dynamic(() => import('@/components/products/HardwareCard').then(mod => ({ default: mod.HardwareCard })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>,
  ssr: true
});


interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: 'GHS';
  image: string; 
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  technicalSpecs: Array<{
    label: string;
    value: string;
    type: 'voltage' | 'material' | 'size' | 'capacity' | 'power' | 'other';
  }>;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  warehouse: {
    id: string;
    name: string;
    location: string;
    phone: string;
  };
  sku: string;
}

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="relative aspect-[4/3] bg-gray-200">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    </div>
    <div className="p-6">
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4"></div>
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { data, loading, error, refetch } = useInitialData();
  const { addToCart } = useCart();
  const [retryCount, setRetryCount] = useState(0);

  const handleQuickAdd = useCallback((productId: string, quantity: number) => {
    console.log(`Adding ${quantity} of product ${productId} to cart`);
    
    if (data?.featured_products) {
      const product = data.featured_products.find((p: any) => p.id.toString() === productId);
      if (product) {
        addToCart(product, quantity);
      }
    }
  }, [data, addToCart]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    refetch();
  }, [refetch]);

  const transformedProducts = useMemo(() => {
    if (!data?.featured_products) return [];

    return data.featured_products.map((product: any) => {

      let imageUrl = product.image_url;

      if (imageUrl && imageUrl.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      // Add fallback if no image URL exists
      if (!imageUrl) {
        imageUrl = '/images/no-image-available.svg';
      }

      // Preload first 3 product images
      if (typeof window !== 'undefined' && product.id <= 3) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        document.head.appendChild(link);
      }

      return {
        id: product.id.toString(),
        name: product.name,
        slug: product.slug,
        description: product.short_description,
        price: parseFloat(product.price),
        currency: 'GHS' as const,
        image: imageUrl,
        category: product.category.name,
        brand: product.brand.name,
        rating: 4.5,
        reviewCount: 12,
        technicalSpecs: [
          { label: 'Voltage', value: '18V', type: 'voltage' as const },
          { label: 'Material', value: 'Stainless Steel', type: 'material' as const },
        ],
        stockStatus: product.stock_status.status === 'in_stock' ? 'in_stock' as const :
                    product.stock_status.status === 'low_stock' ? 'low_stock' as const : 'out_of_stock' as const,
        warehouse: {
          id: "1",
          name: "Tema Warehouse",
          location: "Tema",
          phone: "+233 24 123 4567"
        },
        sku: product.sku,
      };
    });
  }, [data]);

  return (
    <div className="min-h-screen bg-white">
      {}
      <Header />

      {}
      <section className="bg-gradient-to-br from-brand-charcoal to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-flex items-center px-4 py-2 bg-brand-yellow text-brand-charcoal rounded-full font-semibold text-sm shadow-lg">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-charcoal"></span>
                </span>
                Ghana's Leading Hardware Supplier
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Professional Hardware
                <span className="text-brand-yellow"> Tools & Equipment</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Your trusted partner for premium construction tools, 
                industrial equipment, and professional hardware supplies across Ghana.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal font-semibold">
                    <Wrench className="mr-2 h-5 w-5" />
                    Shop Products
                  </Button>
                </Link>
                {}
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <Truck className="h-8 w-8 text-brand-yellow mb-3" />
                    <h3 className="font-semibold text-white">Free Delivery</h3>
                    <p className="text-sm text-gray-300">Orders above GHS 500</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <Shield className="h-8 w-8 text-brand-yellow mb-3" />
                    <h3 className="font-semibold text-white">Warranty</h3>
                    <p className="text-sm text-gray-300">Up to 2 years</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <Clock className="h-8 w-8 text-brand-yellow mb-3" />
                    <h3 className="font-semibold text-white">24/7 Support</h3>
                    <p className="text-sm text-gray-300">Technical assistance</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <CheckCircle className="h-8 w-8 text-brand-yellow mb-3" />
                    <h3 className="font-semibold text-white">Quality Guaranteed</h3>
                    <p className="text-sm text-gray-300">Certified products</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-charcoal mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade tools and equipment selected for quality and performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <div className="text-red-600 mb-4">
                  <div className="text-lg font-semibold mb-2">Unable to Load Products</div>
                  <div className="text-sm">{error}</div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleRetry} className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal">
                    <Clock className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => refetch()}>
                    Dismiss
                  </Button>
                </div>
                {retryCount > 2 && (
                  <div className="mt-4 text-sm text-gray-500">
                    Showing sample products while we connect to the server...
                  </div>
                )}
              </div>
            ) : transformedProducts.length > 0 ? (
              <>
                {transformedProducts.map((product, index) => (
                  <HardwareCard
                    key={product.id}
                    product={product}
                    onQuickAdd={handleQuickAdd}
                    priority={index < 6}
                  />
                ))}
                {retryCount > 0 && (
                  <div className="col-span-full text-center py-4">
                    <Badge className="bg-brand-yellow/20 text-brand-charcoal border-brand-yellow">
                      ✓ Products loaded successfully
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">No products available</div>
                <Button onClick={handleRetry}>Refresh</Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link href="/products" prefetch={true}>
              <Button size="lg" variant="outline" className="border-brand-charcoal text-brand-charcoal hover:bg-brand-yellow hover:text-brand-charcoal hover:border-brand-yellow">
                View All Products
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-charcoal mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600">
              Find exactly what you need from our extensive range
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Power Tools', icon: Wrench, count: '250+', color: 'bg-brand-yellow/20 text-brand-charcoal' },
              { name: 'Hand Tools', icon: Wrench, count: '180+', color: 'bg-brand-yellow/20 text-brand-charcoal' },
              { name: 'Safety Equipment', icon: Shield, count: '120+', color: 'bg-brand-yellow/20 text-brand-charcoal' },
              { name: 'Building Materials', icon: Truck, count: '450+', color: 'bg-brand-yellow/20 text-brand-charcoal' },
            ].map((category) => (
              <Link key={category.name} href={`/products?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-brand-yellow">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-brand-charcoal mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.count} Products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-12 bg-brand-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-yellow mb-2">10,000+</div>
              <div className="text-gray-300">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-yellow mb-2">50+</div>
              <div className="text-gray-300">Brands</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-yellow mb-2">5 Years</div>
              <div className="text-gray-300">in Business</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-yellow mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-yellow/20 rounded-lg blur-xl"></div>
                  <Image 
                    src="/images/ASDLogo.png" 
                    alt="AllShopsDepot Logo" 
                    width={48}
                    height={48}
                    className="relative h-12 w-auto object-contain filter brightness-0 invert"
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AllShopsDepot</h3>
                  <p className="text-sm text-brand-yellow font-medium">Ghana's Hardware Leader</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Your trusted partner for professional hardware and tools in Ghana. 
                Quality products, expert service, and nationwide delivery.
              </p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-300">
                  <span className="w-2 h-2 bg-brand-yellow rounded-full mr-2"></span>
                  10,000+ Happy Customers
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="w-2 h-2 bg-brand-yellow rounded-full mr-2"></span>
                  5+ Years Experience
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-brand-yellow transition-colors">Products</Link></li>
                {}
                {}
                {}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                {}
                {}
                {}
                {}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Tema, Greater Accra, Ghana</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+233 24 123 4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Fri: 8AM-6PM</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AllShopsDepot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardwareCard } from '@/components/products/HardwareCard';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { apiClient } from '@/lib/api';
import {
  ShoppingCart,
  Package,
  Shield,
  Truck,
  ArrowLeft,
  Star,
  Check,
  AlertCircle,
  Clock,
  Heart,
  Share2,
  Plus,
  Minus,
  Info,
  TruckIcon,
  RefreshCw,
  Award,
  ChevronRight
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { product, loading, error } = useProduct(slug);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedToCart, setShowAddedToCart] = useState(false);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!categoryId) return;
      
      setSimilarLoading(true);
      try {
        console.log('🔍 Fetching similar products for category:', categoryId);
        const response = await apiClient.getProducts({
          category: categoryId,
          page_size: 8
        });

        const products = (response as any).results || response;
        console.log('🔍 Got similar products:', products.length);

        const transformedProducts = products.map((product: any) => ({
          ...product,
          image: product.image_url || product.primary_image?.image || '/images/no-image-available.svg',
          price: parseFloat(product.price),
          originalPrice: product.compare_price ? parseFloat(product.compare_price) : undefined,
          category: product.category?.name || 'Unknown',
          brand: product.brand?.name || 'Unknown',
          rating: product.average_rating || 4.5,
          reviewCount: product.reviews?.length || 0,
          stockStatus: product.stock_status?.status === 'in_stock' ? 'in_stock' : 
                      product.stock_status?.status === 'low_stock' ? 'low_stock' : 'out_of_stock',
          technicalSpecs: product.specifications?.map((spec: any) => ({
            label: spec.label,
            value: spec.value,
            type: spec.spec_type || 'other'
          })) || [],
        }));
        
        setSimilarProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching similar products:', error);
        setSimilarProducts([]);
      } finally {
        setSimilarLoading(false);
      }
    };
    
    fetchSimilarProducts();
  }, [categoryId]);

  useEffect(() => {
    if (product?.categoryId && product.categoryId !== categoryId) {
      console.log('🔍 Setting category ID for similar products:', product.categoryId);
      setCategoryId(product.categoryId.toString());
    }
  }, [product?.categoryId, categoryId]);

  const handleAddToCart = async () => {
    if (!product || product.stockStatus === 'out_of_stock') return;
    
    setIsAddingToCart(true);
    try {
      addToCart(product, quantity);
      setShowAddedToCart(true);

      setTimeout(() => {
        setShowAddedToCart(false);
      }, 3000);
      
      console.log(`Added ${quantity} of ${product.name} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product || product.stockStatus === 'out_of_stock') return;

    addToCart(product, quantity);
    console.log(`Buy now: ${quantity} of ${product.name}`);
    
    router.push('/checkout');
  };

  const handleQuickAdd = (productId: string, quantity: number) => {
    
    const productToAdd = similarProducts.find(p => p.id === productId);
    if (productToAdd) {
      addToCart(productToAdd, quantity);
      console.log(`Added ${quantity} of ${productToAdd.name} to cart`);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const filteredSimilarProducts = similarProducts.filter(p => p.id !== product?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 rounded-2xl aspect-square"></div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Product Not Found</h1>
              <p className="text-gray-600 text-lg">{error || 'The product you are looking for does not exist.'}</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.back()} variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href="/products">
                <Button size="lg">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                              />
              {product.stockStatus === 'low_stock' && (
                <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
                  Low Stock
                </Badge>
              )}
              {product.originalPrice && (
                <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </Badge>
              )}
            </div>
            
            {}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {}
          <div className="space-y-6">
            {}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600">
                  GHS {product.price.toLocaleString()}
                </div>
                {product.originalPrice && (
                  <div className="text-xl text-gray-500 line-through">
                    GHS {product.originalPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-gray-600 font-medium">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
              <Badge variant="secondary">{product.category}</Badge>
              <Badge variant="outline">{product.brand}</Badge>
            </div>

            {}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              {product.stockStatus === 'in_stock' ? (
                <>
                  <Check className="h-6 w-6 text-green-600" />
                  <span className="text-green-600 font-medium">In Stock - Ready to ship</span>
                </>
              ) : product.stockStatus === 'low_stock' ? (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">Low Stock - Order soon</span>
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 text-red-600" />
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    className="h-10 w-10 rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-16 text-center font-medium">{quantity}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    className="h-10 w-10 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                  disabled={product.stockStatus === 'out_of_stock' || isAddingToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  variant="outline"
                  className="w-full py-3 text-lg border-2"
                  disabled={product.stockStatus === 'out_of_stock' || isAddingToCart}
                >
                  Buy Now
                </Button>
              </div>

              {}
              {showAddedToCart && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">
                      {quantity} {quantity === 1 ? 'item' : 'items'} added to cart!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-b">
              <div className="flex items-center space-x-3">
                <Truck className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-medium">Free Delivery</div>
                  <div className="text-sm text-gray-600">On orders over GHS 500</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-medium">2 Year Warranty</div>
                  <div className="text-sm text-gray-600">Full coverage</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">30-Day Returns</div>
                  <div className="text-sm text-gray-600">Easy returns</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-6 w-6 text-orange-600" />
                <div>
                  <div className="font-medium">Certified</div>
                  <div className="text-sm text-gray-600">Quality assured</div>
                </div>
              </div>
            </div>

            {}
            <div className="text-sm text-gray-600">
              SKU: <span className="font-medium">{product.sku}</span>
            </div>
          </div>
        </div>

        {}
        <div className="mt-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-8">
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-8">
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold mb-6">Technical Specifications</h3>
                {product.technicalSpecs && product.technicalSpecs.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {product.technicalSpecs.map((spec: any, index: number) => (
                      <div key={index} className="flex justify-between py-3 border-b">
                        <span className="font-medium text-gray-900">{spec.label}</span>
                        <span className="text-gray-600">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specifications available for this product.</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-8">
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-xl font-semibold mb-6">Shipping & Returns</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Truck className="h-5 w-5 mr-2 text-blue-600" />
                      Shipping Information
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Free shipping on orders over GHS 500</li>
                      <li>• Standard delivery: 3-5 business days</li>
                      <li>• Express delivery: 1-2 business days</li>
                      <li>• Tracking available for all orders</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <RefreshCw className="h-5 w-5 mr-2 text-green-600" />
                      Return Policy
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• 30-day return policy</li>
                      <li>• Items must be in original condition</li>
                      <li>• Free return shipping on defective items</li>
                      <li>• Refund processed within 5-7 business days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Similar Products</h2>
              <p className="text-gray-600 mt-2">Customers who viewed this item also viewed</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="hidden md:flex">
                View All Products
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {}
          {}

          {similarLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredSimilarProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredSimilarProducts.slice(0, 8).map((similarProduct) => (
                <HardwareCard
                  key={similarProduct.id}
                  product={similarProduct}
                  onQuickAdd={handleQuickAdd}
                  className="hover:shadow-lg transition-shadow duration-200"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-4">
                <Package className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Similar Products Found</h3>
              <p className="text-gray-600 mb-4">
                There are no other products in this category at the moment.
              </p>
              <Link href="/products">
                <Button>
                  Browse All Products
                </Button>
              </Link>
            </div>
          )}

          {}
          <div className="mt-8 md:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full">
                View All Products
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

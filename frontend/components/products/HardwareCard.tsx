'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  Clock,
  Star,
  Truck,
  Check
} from 'lucide-react';
import { Product, StockStatus } from '@/types/product';
import { useCart } from '@/contexts/CartContext';

interface HardwareCardProps {
  product: Product;
  onQuickAdd?: (productId: string, quantity: number) => void;
  className?: string;
  priority?: boolean;
}

export const HardwareCard = memo<HardwareCardProps>(({ 
  product, 
  className = '',
  priority = false
}) => {
  const { addToCart, isInCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const handleQuickAdd = useCallback(async () => {
    if (isInCart(product.id)) {
      window.location.href = '/cart';
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product, 1);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  }, [product, isInCart, addToCart]);

  const getStockStatusInfo = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return {
          label: 'In Stock',
          color: 'bg-green-100 text-green-800',
          icon: <Check className="h-3 w-3" />,
          message: 'Ready to ship from Tema warehouse'
        };
      case 'low_stock':
        return {
          label: 'Low Stock',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <AlertCircle className="h-3 w-3" />,
          message: 'Only a few items left'
        };
      case 'out_of_stock':
        return {
          label: 'Out of Stock',
          color: 'bg-red-100 text-red-800',
          icon: <Package className="h-3 w-3" />,
          message: 'Currently unavailable'
        };
      case 'pre_order':
        return {
          label: 'Pre-Order',
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock className="h-3 w-3" />,
          message: 'Ships in 5-7 business days'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="h-3 w-3" />,
          message: 'Status unknown'
        };
    }
  };

  const stockInfo = getStockStatusInfo(product.stockStatus);
  const isInStock = product.stockStatus === 'in_stock' || product.stockStatus === 'low_stock';

  const getSpecBadgeVariant = (type: string) => {
    switch (type) {
      case 'voltage':
        return 'default';
      case 'material':
        return 'secondary';
      case 'power':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-50">
        <Link href={`/products/${product.slug}`} prefetch={true}>
          <OptimizedImage
            src={product.image_url || product.image || ''}
            alt={product.name}
            width={product.image_width || 400}
            height={product.image_height || 300}
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            priority={priority}
          />
        </Link>

        {}
        <div className="absolute top-3 left-3">
          <Badge className={`${stockInfo.color} flex items-center gap-1 text-xs font-medium`}>
            {stockInfo.icon}
            {stockInfo.label}
          </Badge>
        </div>

        {}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-xs">
            <Truck className="h-3 w-3 mr-1" />
            {product.warehouse?.location ? product.warehouse.location.split(',')[0] : 'Tema'}
          </Badge>
        </div>

        {}
        {isInStock && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              onClick={handleQuickAdd}
              disabled={isAdding || product.stockStatus === 'out_of_stock'}
              className="shadow-lg"
            >
              {isAdding ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : isInCart(product.id) ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {}
      <CardContent className="p-4">
        {}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            {typeof product.brand === 'string' ? product.brand : product.brand.name}
          </span>
          <span className="text-xs text-gray-500">
            {typeof product.category === 'string' ? product.category : product.category.name}
          </span>
        </div>

        {}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.technicalSpecs && product.technicalSpecs.slice(0, 3).map((spec, index) => (
            <Badge 
              key={index} 
              variant={getSpecBadgeVariant(spec.type)}
              className="text-xs"
            >
              {spec.value}
            </Badge>
          ))}
        </div>

        {}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {product.rating || 0} ({product.reviewCount || 0})
          </span>
        </div>

        {}
        <div className="flex items-baseline mb-3">
          <span className="text-2xl font-bold text-gray-900">
            GHS {product.price.toLocaleString()}
          </span>
        </div>

        {}
        <p className="text-xs text-gray-600 mb-3">
          {stockInfo.message}
        </p>
      </CardContent>

      {}
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Link href={`/products/${product.slug}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          
          {isInStock ? (
            <Button 
              onClick={handleQuickAdd}
              disabled={isAdding || product.stockStatus === 'out_of_stock'}
              className="flex-1"
              variant={isInCart(product.id) ? "secondary" : "default"}
            >
              {isAdding ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Adding...
                </>
              ) : isInCart(product.id) ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" disabled className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              Out of Stock
            </Button>
          )}
        </div>
      </CardFooter>
      
      {}
      {showAdded && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg z-10">
          Added to cart!
        </div>
      )}
    </Card>
  );
});

HardwareCard.displayName = 'HardwareCard';

export default HardwareCard;

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  MapPin,
  Wrench,
  CheckCircle,
  Upload,
  Package,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from '@/contexts/LocationContext';
import HardwareNavigation from './HardwareNavigation';
import { apiClient } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Search component that uses useSearchParams
function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    // Clear existing timeout
    if ((window as any).searchTimeout) {
      clearTimeout((window as any).searchTimeout);
    }
    
    // Set new timeout for search
    (window as any).searchTimeout = setTimeout(async () => {
      if (value.trim()) {
        setIsSearching(true);
        try {
          const response = await apiClient.debouncedSearch(value, {}, 300);
          setSearchResults(response.results || []);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
  };

  // Handle product selection
  const handleProductSelect = (product: any) => {
    router.push(`/products/${product.slug}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Initialize search query from URL params
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/products') {
      const searchParam = searchParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, [searchParams]);

  // Close search when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Main Search Input */}
      <div className="relative flex-1 max-w-xl search-container">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search hardware, tools, SKU (e.g., M12 Bolt, DW-DCD780C2, Sandcrete blocks)..."
            className="pl-12 pr-12 h-12 bg-gray-50 border-gray-300 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow text-brand-charcoal shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            // Don't open modal for main search input, only for keyboard shortcut
            // onFocus={() => setIsSearchOpen(true)}
          />
          
          {/* Search suggestions dropdown */}
          <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 z-50 ${
            searchQuery && (searchResults.length > 0 || isSearching) 
              ? 'opacity-100 visible' 
              : 'opacity-0 invisible'
          }`}>
            {isSearching ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  {searchResults.slice(0, 5).map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                        <img
                          src={product.image_url || 'https://via.placeholder.com/48x48/e5e7eb/6b7280?text=No+Image'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48/e5e7eb/6b7280?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.brand?.name} • {product.category?.name}
                        </div>
                        <div className="text-sm font-semibold text-brand-yellow">
                          GHS {parseFloat(product.price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {searchResults.length > 5 && (
                  <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-sm text-brand-yellow hover:text-brand-yellow/80 font-medium">
                      View all {searchResults.length} results →
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No products found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-4">
                <div className="text-sm text-gray-500 text-center">
                  Start typing to search for products...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal (for keyboard shortcut) */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent className="p-0 max-w-2xl">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Search hardware, tools, brands, categories..." 
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchQuery}
                onValueChange={handleSearchInputChange}
              />
            </div>
            <CommandList>
              {isSearching ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <CommandGroup heading="Products - Click to view category">
                  {searchResults.slice(0, 8).map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleProductSelect(product)}
                      className="flex items-center p-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                        <img
                          src={product.image_url || 'https://via.placeholder.com/40x40/e5e7eb/6b7280?text=No+Image'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x40/e5e7eb/6b7280?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.brand?.name} • {product.category?.name}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-brand-yellow ml-2">
                        GHS {parseFloat(product.price).toLocaleString()}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : searchQuery ? (
                <CommandEmpty>No products found for "{searchQuery}"</CommandEmpty>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Type to search for products...
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Header: React.FC = () => {
  const { itemCount: cartItemCount } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { selectedWarehouse, setSelectedWarehouse, warehouses } = useLocation();
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Store current page in session storage for smart redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // Don't store auth pages as previous page
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('previousPage', currentPath);
      }
    }
  }, []);

  // Handle warehouse selection change
  const handleWarehouseChange = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    if (warehouse) {
      setSelectedWarehouse(warehouse);
      
      // Store in localStorage for persistence
      localStorage.setItem('selectedWarehouse', warehouseId);
      
      // Show notification (you could add a toast here)
      console.log(`Warehouse changed to: ${warehouse.name}`);
    }
  };

  // Load saved warehouse on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWarehouseId = localStorage.getItem('selectedWarehouse');
      if (savedWarehouseId) {
        handleWarehouseChange(savedWarehouseId);
      }
    }
  }, [handleWarehouseChange]);

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top Bar - Warehouse Info & Location Picker */}
          <div className="hidden lg:flex items-center justify-between py-2 text-sm text-brand-charcoal border-b border-gray-100">
            <div className="flex items-center space-x-6">
              {/* Location Picker */}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-brand-yellow" />
                <select 
                  value={selectedWarehouse.id}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="bg-transparent border-none text-brand-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow rounded px-2 py-1 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-brand-yellow font-medium">
                  {selectedWarehouse.estimatedDelivery}
                </span>
              </div>
              
              <div className="flex items-center text-brand-charcoal">
                <Phone className="h-4 w-4 mr-1 text-brand-yellow" />
                <span>{selectedWarehouse.phone}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-brand-charcoal">
                <span className="text-brand-yellow font-medium">GHS</span>
                <span className="ml-1">Pricing</span>
              </span>
              <span className="flex items-center text-brand-charcoal">
                <CheckCircle className="h-4 w-4 text-brand-yellow mr-1" />
                <span>Nation Wide Delivery</span>
              </span>
              
              {/* Payment Trust Icons */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">We Accept:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-8 h-5 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                  <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>
                  <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">MoMo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/images/ASDLogo.png" 
                alt="AllShopsDepot Logo" 
                className="h-12 w-auto object-contain lg:h-[50px]"
              />
            </Link>

            {/* Desktop Search - Enhanced */}
            <div className="hidden lg:flex flex-1 max-w-3xl mx-8">
              <Suspense fallback={<div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse"></div>}>
                <SearchComponent />
              </Suspense>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Mega Navigation */}
              <HardwareNavigation />
              
              {/* Auth & Cart Icons */}
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <>
                    {/* Profile Icon */}
                    <div className="relative group">
                      <Link href="/dashboard">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-brand-charcoal hover:text-brand-yellow hover:bg-brand-yellow/10 px-3"
                        >
                          <User className="h-5 w-5" />
                          <span className="ml-2 hidden xl:inline">{user?.username}</span>
                        </Button>
                      </Link>
                      
                      {/* Profile Dropdown */}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-4">
                          <div className="border-b border-gray-100 pb-3 mb-3">
                            <p className="text-sm font-medium text-brand-charcoal">{user?.username}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-brand-yellow/20 text-brand-charcoal px-2 py-1 rounded">
                                {user?.role}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Link href="/dashboard" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                              Dashboard
                            </Link>
                            {user?.role === 'ADMIN' && (
                              <>
                                <Link href="/admin/products" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <Package className="inline h-3 w-3 mr-1" />
                                  Manage Products
                                </Link>
                                <Link href="/admin/products/new" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <Plus className="inline h-3 w-3 mr-1" />
                                  Add Product
                                </Link>
                                <Link href="/admin/orders" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <ShoppingCart className="inline h-3 w-3 mr-1" />
                                  Manage Orders
                                </Link>
                                <Link href="/admin/inventory" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                                  <Package className="inline h-3 w-3 mr-1" />
                                  Inventory
                                </Link>
                              </>
                            )}
                            <Link href="/orders" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                              Order History
                            </Link>
                            <Link href="/profile" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                              Account Settings
                            </Link>
                            <Link href="/wishlist" className="block px-3 py-2 text-sm text-brand-charcoal hover:bg-gray-50 rounded">
                              Wishlist
                            </Link>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button 
                                onClick={() => logout().catch(console.error)}
                                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Sign In Button */}
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="text-brand-charcoal hover:text-brand-yellow">
                        <User className="h-5 w-5 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}

                {/* Cart Icon */}
                <Link href="/cart">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="relative border-brand-charcoal hover:border-brand-yellow hover:text-brand-yellow hover:bg-brand-yellow/10 px-3"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isClient && cartItemCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-brand-yellow text-brand-charcoal border-brand-charcoal"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <div className="space-y-3">
                <Suspense fallback={<div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse"></div>}>
                  <SearchComponent />
                </Suspense>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-brand-charcoal hover:text-brand-yellow hover:bg-brand-yellow/10">
                      Categories
                    </Button>
                  </Link>
                  {/* <Link href="/brands" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Brands
                    </Button>
                  </Link> */}
                  
                  {isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-brand-charcoal hover:text-brand-yellow hover:bg-brand-yellow/10">
                        <User className="h-4 w-4 mr-2" />
                        {user?.username}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-brand-charcoal hover:text-brand-yellow hover:bg-brand-yellow/10">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal font-medium">Register</Button>
                      </Link>
                    </>
                  )}
                  
                  <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start border-brand-charcoal hover:border-brand-yellow hover:text-brand-yellow hover:bg-brand-yellow/10">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart {isClient && cartItemCount > 0 && `(${cartItemCount})`}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;

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
  Truck,
  CheckCircle,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import HardwareNavigation from './HardwareNavigation';

export const Header: React.FC = () => {
  const { itemCount: cartItemCount } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search results will be populated by actual search functionality
  const searchResults: any[] = [];

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top Bar - Warehouse Info & Location Picker */}
          <div className="hidden lg:flex items-center justify-between py-2 text-sm text-gray-600 border-b border-gray-100">
            <div className="flex items-center space-x-6">
              {/* Location Picker */}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <select className="bg-transparent border-none text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
                  <option value="tema">Tema Warehouse</option>
                  <option value="accra">Accra Warehouse</option>
                </select>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-green-600 font-medium">In Stock</span>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                <span>+233 30 123 4567</span>
              </div>
              
              {/* Delivery Estimator */}
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Delivery to East Legon by 4 PM</span>
                <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                  Change
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="text-green-600 font-medium">GHS</span>
                <span className="ml-1">Pricing</span>
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span>Free Delivery over GHS 500</span>
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
              <span className="text-xl font-bold text-gray-900 hidden lg:inline">AllShopsDepot</span>
            </Link>

            {/* Desktop Search - Enhanced */}
            <div className="hidden lg:flex flex-1 max-w-3xl mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search hardware, tools, SKU (e.g., M12 Bolt, DW-DCD780C2, Sandcrete blocks)..."
                  className="pl-12 pr-12 h-12 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-base shadow-sm hover:shadow-md transition-shadow"
                  onFocus={() => setIsSearchOpen(true)}
                  readOnly
                />
                <kbd className="absolute right-4 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded font-mono">
                  ⌘K
                </kbd>
                
                {/* Search suggestions dropdown */}
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Popular Searches</div>
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                        18V Cordless Drill
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                        Stainless Steel Pipe
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                        M12 Bolts
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                        Sandcrete Blocks
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                          className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3"
                        >
                          <User className="h-5 w-5" />
                          <span className="ml-2 hidden xl:inline">{user?.username}</span>
                        </Button>
                      </Link>
                      
                      {/* Profile Dropdown */}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-4">
                          <div className="border-b border-gray-100 pb-3 mb-3">
                            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {user?.role}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                              Dashboard
                            </Link>
                            {user?.role === 'ADMIN' && (
                              <>
                                <Link href="/upload" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                                  <Upload className="inline h-3 w-3 mr-1" />
                                  Upload Product
                                </Link>
                                <Link href="/test-supabase" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                                  🧪 Test Supabase
                                </Link>
                              </>
                            )}
                            <Link href="/orders" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                              Order History
                            </Link>
                            <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                              Account Settings
                            </Link>
                            <Link href="/wishlist" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                              Wishlist
                            </Link>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button 
                                onClick={() => logout().catch(console.error)}
                                className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
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
                      <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-600">
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
                    className="relative border-gray-300 hover:border-blue-500 hover:text-blue-600 px-3"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isClient && cartItemCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search hardware..."
                    className="pl-10"
                    onFocus={() => setIsSearchOpen(true)}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
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
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        {user?.username}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full">Register</Button>
                      </Link>
                    </>
                  )}
                  
                  <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
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

      {/* Command Palette Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent className="p-0 max-w-2xl">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Search hardware, tools, brands, categories..." 
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              
              {/* <CommandGroup heading="Categories">
                {categories.slice(0, 5).map((category) => (
                  <CommandItem key={category} className="flex items-center">
                    <Wrench className="mr-2 h-4 w-4" />
                    <span>{category}</span>
                    <Badge variant="secondary" className="ml-auto">
                      Category
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup> */}
              
              {/* <CommandGroup heading="Popular Brands">
                {brands.slice(0, 5).map((brand) => (
                  <CommandItem key={brand} className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    <span>{brand}</span>
                    <Badge variant="outline" className="ml-auto">
                      Brand
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup> */}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;

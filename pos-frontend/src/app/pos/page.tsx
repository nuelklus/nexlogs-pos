'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { posApiClient, type Product } from '@/lib/pos-api';
// WebSocket imports removed - single terminal mode
import { formatCurrency, formatStockQuantity, getStockStatusColor, getStockStatusText } from '@/lib/utils';
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { ShoppingCartComponent } from '@/components/pos/ShoppingCart';
import { CartSummary } from '@/components/pos/CartSummary';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { shoppingCart, type CartItem } from '@/lib/cart';
// ConnectionStatus removed - single terminal mode
import { SearchBar } from '@/components/pos/SearchBar';
import { StockAlerts } from '@/components/pos/StockAlerts';

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartSummary, setShowCartSummary] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'cart' | 'details'>('cart');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // ConnectionStatus removed - single terminal mode

  useEffect(() => {
    // Check authentication
    if (!posApiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Initialize POS (WebSocket temporarily disabled for testing)
    initializePOS();
    
    return () => {
      // stockSyncManager.disconnect();
    };
  }, [router]);

  const initializePOS = async () => {
    try {
      // Load products first (critical for UI)
      await loadProducts();
      
      // Load stock alerts
      await loadStockAlerts();
      
      // WebSocket disabled - running in offline mode
      console.log('✅ POS System Ready - Single Terminal Mode');
      console.log('📦 All features available: product management, stock updates, search');
      console.log('🔄 Real-time sync disabled for single terminal use');
      
    } catch (error) {
      console.error('❌ Failed to initialize POS:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await posApiClient.getProducts({
        store_id: posApiClient.getStoreId()
      });
      setProducts(data.results);
      setFilteredProducts(data.results);
    } catch (error) {
      console.error('❌ Failed to load products:', error);
    }
  };

  const loadStockAlerts = async () => {
    try {
      const alerts = await posApiClient.getLowStockAlerts(5, posApiClient.getStoreId());
      console.log('📊 Stock alerts:', alerts);
    } catch (error) {
      console.error('❌ Failed to load stock alerts:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    console.log('🛒 Adding to cart:', product.name);
    shoppingCart.addItem(product, 1);
    const updatedItems = shoppingCart.getItems();
    console.log('🛒 Cart items after add:', updatedItems);
    setCartItems(updatedItems);
  };

  const handleCartUpdate = (items: CartItem[]) => {
    setCartItems(items);
  };

  const handleCheckout = (totals: { subtotal: number; tax: number; total: number; itemCount: number }) => {
    console.log('🛒 Checkout clicked:', totals);
    console.log('🔍 Setting showPaymentModal to true');
    setShowPaymentModal(true);
    console.log('🔍 showPaymentModal state should now be true');
  };

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const product = await posApiClient.getProductByBarcode(barcode, posApiClient.getStoreId());
      if (product) {
        setSelectedProduct(product);
        console.log(`🔍 Found product by barcode: ${product.name}`);
      } else {
        console.log(`❌ No product found for barcode: ${barcode}`);
        // Could show "Product not found" message
      }
    } catch (error) {
      console.error('❌ Failed to scan barcode:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      try {
        const searchResults = await posApiClient.searchProducts(query, posApiClient.getStoreId());
        setFilteredProducts(searchResults);
      } catch (error) {
        console.error('❌ Failed to search products:', error);
        // Fallback to client-side filtering
        const filtered = products.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.sku.toLowerCase().includes(query.toLowerCase()) ||
          (product.barcode && product.barcode.includes(query))
        );
        setFilteredProducts(filtered);
      }
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setRightPanelView('details');
    console.log('📋 Selected product:', product.name);
  };

  const handleStockUpdateRequest = async (productId: string, newQuantity: number, changeAmount: number) => {
    try {
      const response = await posApiClient.updateStock({
        product_id: productId,
        quantity: newQuantity,
        change_amount: changeAmount,
        store_id: posApiClient.getStoreId(),
        device_id: posApiClient.getDeviceId()
      });
      
      console.log('✅ Stock update successful:', response);
      
      // The WebSocket will update the local state automatically
      
    } catch (error) {
      console.error('❌ Failed to update stock:', error);
      // Could show error message to user
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Hardware POS</h1>
              <div className="text-sm text-gray-500">
                Store: {posApiClient.getStoreId()} | User: {posApiClient.getCurrentUser()}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-600 font-medium">
                Single Terminal Mode
              </div>
              <button
                onClick={() => posApiClient.logout()}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-screen pt-16">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col">
          {/* Search and Scanner */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <SearchBar
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search products by name, SKU, or barcode..."
              />
              <BarcodeScanner onScan={handleBarcodeScan} />
            </div>
          </div>

          {/* Stock Alerts */}
          <StockAlerts storeId={posApiClient.getStoreId()} />

          {/* Product Grid */}
          <div className="flex-1 p-4 overflow-auto">
            <ProductGrid
              products={filteredProducts}
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
              onStockUpdate={handleStockUpdateRequest}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setRightPanelView('cart')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'cart'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Shopping Cart
                </button>
                <button
                  onClick={() => setRightPanelView('details')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'details'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Product Details
                </button>
              </div>
              <ShoppingCartComponent onCartUpdate={handleCartUpdate} />
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 flex flex-col">
            {rightPanelView === 'cart' ? (
              /* Cart View */
              cartItems.length > 0 ? (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.product.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          {/* Product Image */}
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <div className="text-2xl text-gray-400">📦</div>
                            </div>
                          )}

                          {/* Product Details */}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{item.product.sku}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(parseFloat(item.product.price))}
                              </span>
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      shoppingCart.updateQuantity(item.product.id, item.quantity - 1);
                                      setCartItems(shoppingCart.getItems());
                                    }
                                  }}
                                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    shoppingCart.updateQuantity(item.product.id, item.quantity + 1);
                                    setCartItems(shoppingCart.getItems());
                                  }}
                                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Item Total and Remove */}
                          <div className="text-right">
                            <span className="font-medium text-gray-900 block mb-2">
                              {formatCurrency(parseFloat(item.product.price) * item.quantity)}
                            </span>
                            <button
                              onClick={() => {
                                shoppingCart.removeItem(item.product.id);
                                setCartItems(shoppingCart.getItems());
                              }}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cart Footer */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(shoppingCart.getTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (12%):</span>
                        <span>{formatCurrency(shoppingCart.getTotals().tax)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(shoppingCart.getTotals().total)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          shoppingCart.clear();
                          setCartItems([]);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Clear Cart
                      </button>
                      <button
                        onClick={() => handleCheckout(shoppingCart.getTotals())}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty Cart */
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                    <p className="text-sm">Add products to get started</p>
                  </div>
                </div>
              )
            ) : (
              /* Product Details View */
              selectedProduct ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <Cart
                    selectedProduct={selectedProduct}
                    onStockUpdate={handleStockUpdateRequest}
                  />
                </div>
              ) : (
                /* No Product Selected */
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium mb-2">No Product Selected</h3>
                    <p className="text-sm">Click "Select" on a product to view details</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          cartItems={cartItems}
          totals={shoppingCart.getTotals()}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Printer, Check } from 'lucide-react';
import { shoppingCart, type CartItem } from '@/lib/cart';
import { posApiClient } from '@/lib/pos-api';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totals: { subtotal: number; tax: number; total: number; itemCount: number };
}

export function PaymentModal({ isOpen, onClose, cartItems, totals }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>(totals.total.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [change, setChange] = useState<number>(0);

  // Calculate change when amount paid changes
  const handleAmountPaidChange = (value: string) => {
    setAmountPaid(value);
    const paid = parseFloat(value) || 0;
    const calculatedChange = Math.max(0, paid - totals.total);
    setChange(calculatedChange);
  };

  // Process payment
  const handlePayment = async () => {
    if (isProcessing) return;

    const paid = parseFloat(amountPaid) || 0;
    if (paid < totals.total) {
      alert('Amount paid must be at least the total amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare transaction data
      const transactionData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product.price),
          total_price: parseFloat(item.product.price) * item.quantity
        })),
        payment_method: paymentMethod,
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        amount_paid: paid,
        notes: '',
        store_id: posApiClient.getStoreId(),
        device_id: posApiClient.getDeviceId()
      };

      // Create transaction
      const response = await posApiClient.createTransaction(transactionData);
      
      if (response) {
        // Clear cart and close modal
        shoppingCart.clear();
        onClose();
        
        // Show success message
        alert(`Payment successful! Transaction ID: ${response.transaction_id}`);
        
        // Optional: Print receipt
        if (confirm('Would you like to print a receipt?')) {
          printReceipt(response);
        }
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt (placeholder)
  const printReceipt = (transaction: any) => {
    console.log('🖨️ Printing receipt:', transaction);
    alert('Receipt printing functionality will be implemented in Phase 2.5');
  };

  // Reset form
  const handleReset = () => {
    setAmountPaid(totals.total.toString());
    setChange(0);
  };

  // Debug log
  console.log('🔍 PaymentModal rendering with back button');

  if (!isOpen) return null;

  console.log('🔍 PaymentModal rendering - full modal should be visible');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-4">Order Summary</h3>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{formatCurrency(parseFloat(item.product.price) * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (12%):</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-4">Payment Method</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Cash</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod('card')}
              disabled={true}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Card</span>
              <span className="text-xs text-gray-500 block mt-1">(Coming Soon)</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod('mobile')}
              disabled={true}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'mobile'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Smartphone className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Mobile</span>
              <span className="text-xs text-gray-500 block mt-1">(Coming Soon)</span>
            </button>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Payment Details</h3>
          
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid:
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Enter amount paid"
                  step="0.01"
                  min="0"
                />
              </div>
              
              {change > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-green-700">Change:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod !== 'cash' && (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600">
                {paymentMethod === 'card' && 'Card payment processing will be available soon.'}
                {paymentMethod === 'mobile' && 'Mobile money payment will be available soon.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium font-bold"
          >
            ← Back
          </button>
          
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Reset
          </button>
          
          <button
            onClick={handlePayment}
            disabled={isProcessing || paymentMethod !== 'cash' || parseFloat(amountPaid) < totals.total}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-t-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

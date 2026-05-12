'use client';

import { Printer, Download, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReceiptItem {
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ReceiptProps {
  transaction: {
    transaction_id: string;
    receipt_number: string;
    created_at: string;
    payment_method: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
    items: ReceiptItem[];
    user_name: string;
  };
}

export function Receipt({ transaction }: ReceiptProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(getReceiptHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([getReceiptHTML()], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${transaction.receipt_number}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEmail = () => {
    // Placeholder for email functionality
    alert('Email receipt functionality will be implemented in Phase 3');
  };

  const getReceiptHTML = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${transaction.receipt_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #333; }
        .header p { margin: 5px 0; color: #666; }
        .transaction-info { margin-bottom: 20px; }
        .transaction-info div { margin: 5px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f5f5f5; }
        .totals { margin-bottom: 20px; }
        .totals div { display: flex; justify-content: space-between; margin: 5px 0; }
        .totals .total { font-weight: bold; font-size: 18px; border-top: 1px solid #ddd; padding-top: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
        .payment-info { margin-bottom: 20px; background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HARDWARE STORE</h1>
        <p>123 Main Street, Accra, Ghana</p>
        <p>Tel: +233 123 456 789</p>
        <p>📧 info@hardwarestore.com</p>
      </div>

      <div class="transaction-info">
        <div><strong>Receipt #:</strong> ${transaction.receipt_number}</div>
        <div><strong>Transaction ID:</strong> ${transaction.transaction_id}</div>
        <div><strong>Date:</strong> ${new Date(transaction.created_at).toLocaleString()}</div>
        <div><strong>Cashier:</strong> ${transaction.user_name}</div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items.map(item => `
            <tr>
              <td>${item.product_name}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unit_price)}</td>
              <td>${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal:</span><span>${formatCurrency(transaction.subtotal)}</span></div>
        <div><span>Tax (12%):</span><span>${formatCurrency(transaction.tax_amount)}</span></div>
        <div class="total"><span>Total:</span><span>${formatCurrency(transaction.total_amount)}</span></div>
      </div>

      <div class="payment-info">
        <div><strong>Payment Method:</strong> ${transaction.payment_method.toUpperCase()}</div>
        <div><strong>Amount Paid:</strong> ${formatCurrency(transaction.amount_paid)}</div>
        <div><strong>Change:</strong> ${formatCurrency(transaction.change_amount)}</div>
      </div>

      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>Please come again</p>
        <p>--- End of Receipt ---</p>
      </div>
    </body>
    </html>
  `;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Receipt Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">HARDWARE STORE</h2>
        <p className="text-gray-600">123 Main Street, Accra, Ghana</p>
        <p className="text-gray-600">Tel: +233 123 456 789</p>
        <p className="text-gray-600">📧 info@hardwarestore.com</p>
      </div>

      {/* Transaction Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Receipt #:</strong> {transaction.receipt_number}</div>
          <div><strong>Transaction ID:</strong> {transaction.transaction_id}</div>
          <div><strong>Date:</strong> {new Date(transaction.created_at).toLocaleString()}</div>
          <div><strong>Cashier:</strong> {transaction.user_name}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-2">
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-xs text-gray-500">{item.product_sku}</div>
                </td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                <td className="text-right py-2 font-medium">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (12%):</span>
            <span>{formatCurrency(transaction.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span className="text-green-600">{formatCurrency(transaction.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span><strong>Payment Method:</strong></span>
            <span>{transaction.payment_method.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span><strong>Amount Paid:</strong></span>
            <span>{formatCurrency(transaction.amount_paid)}</span>
          </div>
          <div className="flex justify-between">
            <span><strong>Change:</strong></span>
            <span className="text-green-600 font-medium">{formatCurrency(transaction.change_amount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
        <button
          onClick={handleEmail}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t text-gray-600">
        <p className="font-medium">Thank you for your purchase!</p>
        <p className="text-sm">Please come again</p>
      </div>
    </div>
  );
}

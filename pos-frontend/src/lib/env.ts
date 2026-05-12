// Environment configuration for POS frontend

export const env = {
  // Backend API URL
  NEXT_PUBLIC_POS_API_URL: process.env.NEXT_PUBLIC_POS_API_URL || 'http://localhost:8000/api/pos',
  
  // WebSocket URL
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/stock/',
  
  // Store configuration
  NEXT_PUBLIC_DEFAULT_STORE_ID: process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'main',
  
  // App configuration
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Hardware POS',
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_BARCODE_SCANNER: process.env.NEXT_PUBLIC_ENABLE_BARCODE_SCANNER !== 'false',
  NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC !== 'false',
  NEXT_PUBLIC_ENABLE_STOCK_ALERTS: process.env.NEXT_PUBLIC_ENABLE_STOCK_ALERTS !== 'false',
  
  // Debug mode
  NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
};

// Export individual variables for convenience
export const {
  NEXT_PUBLIC_POS_API_URL,
  NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_DEFAULT_STORE_ID,
  NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_ENABLE_BARCODE_SCANNER,
  NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC,
  NEXT_PUBLIC_ENABLE_STOCK_ALERTS,
  NEXT_PUBLIC_DEBUG_MODE,
} = env;

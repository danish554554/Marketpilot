import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  exchangeRateToUSD: number; // For optional estimated conversion
  defaultDecimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs.',
    name: 'Pakistani Rupee',
    flag: '🇵🇰',
    exchangeRateToUSD: 280,
    defaultDecimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    exchangeRateToUSD: 1,
    defaultDecimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    exchangeRateToUSD: 3.67,
    defaultDecimals: 2,
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    name: 'Saudi Riyal',
    flag: '🇸🇦',
    exchangeRateToUSD: 3.75,
    defaultDecimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    exchangeRateToUSD: 0.79,
    defaultDecimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    exchangeRateToUSD: 0.92,
    defaultDecimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    exchangeRateToUSD: 1.36,
    defaultDecimals: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    exchangeRateToUSD: 83.5,
    defaultDecimals: 0,
  },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  currencyConfig: CurrencyConfig;
  currencySymbol: string;
  formatAmount: (amount: number | string | undefined | null, options?: { showCode?: boolean; decimals?: number }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to PKR for Pakistani startup context, fallback to stored choice
  const [currency, setCurrencyState] = useState<string>(() => {
    const saved = localStorage.getItem('marketpilot_currency');
    return saved && SUPPORTED_CURRENCIES[saved] ? saved : 'PKR';
  });

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      localStorage.setItem('marketpilot_currency', code);
    }
  };

  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.PKR;
  const currencySymbol = currencyConfig.symbol;

  const formatAmount = (
    amount: number | string | undefined | null,
    options?: { showCode?: boolean; decimals?: number }
  ): string => {
    if (amount === undefined || amount === null || amount === '') {
      return `${currencySymbol} 0`;
    }

    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    if (isNaN(num)) {
      return `${currencySymbol} 0`;
    }

    const decimals = options?.decimals !== undefined ? options.decimals : currencyConfig.defaultDecimals;

    const formattedNum = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);

    if (options?.showCode) {
      return `${currencyConfig.code} ${currencySymbol} ${formattedNum}`;
    }
    return `${currencySymbol} ${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyConfig,
        currencySymbol,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

/**
 * Cryptocurrency Payment Service
 * Handles crypto payments with fallback to simulated transactions for demo purposes
 */

import { validateCryptoAddress } from '@/utils/cryptoValidation';

export interface CryptoPaymentRequest {
  userId: string;
  amount: number; // USD amount
  currency: 'bitcoin' | 'ethereum' | 'usdc';
  walletAddress: string;
  email: string;
  metadata?: Record<string, unknown>;
}

export interface CryptoPaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  estimatedDelivery?: string;
  networkFee?: number;
  exchangeRate?: number;
  actualCryptoAmount?: number;
  message?: string;
}

export class CryptoPaymentService {
  private static instance: CryptoPaymentService;

  static getInstance(): CryptoPaymentService {
    if (!CryptoPaymentService.instance) {
      CryptoPaymentService.instance = new CryptoPaymentService();
    }
    return CryptoPaymentService.instance;
  }

  /**
   * Get current exchange rates (simulated for demo)
   * In production, this would fetch from real APIs like CoinGecko or CoinMarketCap
   */
  private async getExchangeRates(): Promise<Record<string, number>> {
    // Simulated rates - in production, fetch from real API
    return {
      bitcoin: 42000, // BTC/USD
      ethereum: 2500,  // ETH/USD
      usdc: 1.0        // USDC/USD
    };
  }

  /**
   * Calculate network fees (simulated for demo)
   */
  private calculateNetworkFee(currency: string, amount: number): number {
    switch (currency) {
      case 'bitcoin':
        return Math.max(5, amount * 0.01); // $5 minimum or 1% of amount
      case 'ethereum':
        return Math.max(2, amount * 0.005); // $2 minimum or 0.5% of amount
      case 'usdc':
        return Math.max(1, amount * 0.002); // $1 minimum or 0.2% of amount
      default:
        return 0;
    }
  }

  /**
   * Estimate delivery time based on currency
   */
  private getEstimatedDelivery(currency: string): string {
    switch (currency) {
      case 'bitcoin':
        return '10-60 minutes (1-6 confirmations)';
      case 'ethereum':
        return '2-15 minutes (12 confirmations)';
      case 'usdc':
        return '2-15 minutes (12 confirmations)';
      default:
        return '15-30 minutes';
    }
  }

  /**
   * Process cryptocurrency payment
   */
  async processCryptoPayment(request: CryptoPaymentRequest): Promise<CryptoPaymentResponse> {
    try {
      // Validate wallet address
      if (!validateCryptoAddress(request.walletAddress, request.currency)) {
        return {
          success: false,
          error: `Invalid ${request.currency} wallet address format`
        };
      }

      // Validate minimum amount
      if (request.amount < 5) {
        return {
          success: false,
          error: 'Minimum crypto payout is $5.00'
        };
      }

      // Get exchange rates
      const rates = await this.getExchangeRates();
      const exchangeRate = rates[request.currency];
      
      if (!exchangeRate) {
        return {
          success: false,
          error: `Exchange rate not available for ${request.currency}`
        };
      }

      // Calculate crypto amount and fees
      const networkFee = this.calculateNetworkFee(request.currency, request.amount);
      const netAmount = request.amount - networkFee;
      const cryptoAmount = netAmount / exchangeRate;

      // Generate simulated transaction ID
      const transactionId = `crypto_${request.currency}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // In production, this is where you'd integrate with:
      // - Coinbase Commerce API
      // - BitPay API
      // - Blockchain.com API
      // - Or other crypto payment processors

      // For demo purposes, we simulate the transaction
      console.log('Processing crypto payment:', {
        currency: request.currency,
        usdAmount: request.amount,
        cryptoAmount,
        walletAddress: request.walletAddress,
        networkFee,
        transactionId
      });

      // Simulate a slight delay for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        transactionId,
        exchangeRate,
        actualCryptoAmount: cryptoAmount,
        networkFee,
        estimatedDelivery: this.getEstimatedDelivery(request.currency),
        message: `${cryptoAmount.toFixed(8)} ${request.currency.toUpperCase()} will be sent to ${request.walletAddress}`
      };

    } catch (error) {
      console.error('Crypto payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Crypto payment processing failed'
      };
    }
  }

  /**
   * Get supported cryptocurrencies with their details
   */
  getSupportedCurrencies() {
    return [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        icon: '₿',
        minAmount: 5,
        avgFee: '$5-15',
        deliveryTime: '10-60 min'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        icon: 'Ξ',
        minAmount: 5,
        avgFee: '$2-10',
        deliveryTime: '2-15 min'
      },
      {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        icon: '$',
        minAmount: 5,
        avgFee: '$1-3',
        deliveryTime: '2-15 min'
      }
    ];
  }

  /**
   * Check if crypto payment is available (for feature flagging)
   */
  isAvailable(): boolean {
    // In production, you might check API keys, service status, etc.
    return true;
  }
}

export default CryptoPaymentService;
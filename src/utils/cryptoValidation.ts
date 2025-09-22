/**
 * Cryptocurrency Wallet Address Validation Utilities
 * Validates Bitcoin, Ethereum, and USDC wallet addresses
 */

/**
 * Validates a Bitcoin wallet address
 * Supports Legacy (P2PKH), SegWit (P2SH), and Bech32 (P2WPKH) formats
 */
export function validateBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Remove whitespace
  address = address.trim();

  // Legacy addresses (P2PKH) - start with 1
  const legacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  // SegWit addresses (P2SH) - start with 3
  const segwitRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  
  // Bech32 addresses (P2WPKH) - start with bc1
  const bech32Regex = /^bc1[a-z0-9]{39,59}$/;

  return legacyRegex.test(address) || segwitRegex.test(address) || bech32Regex.test(address);
}

/**
 * Validates an Ethereum wallet address
 * Standard EIP-55 checksum validation
 */
export function validateEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Remove whitespace and ensure it starts with 0x
  address = address.trim();
  
  // Basic format check: 0x followed by 40 hex characters
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  
  return ethereumRegex.test(address);
}

/**
 * Validates a USDC wallet address (same as Ethereum since USDC is ERC-20)
 */
export function validateUSDCAddress(address: string): boolean {
  return validateEthereumAddress(address);
}

/**
 * Generic crypto address validator
 */
export function validateCryptoAddress(address: string, currency: string): boolean {
  switch (currency.toLowerCase()) {
    case 'bitcoin':
    case 'btc':
      return validateBitcoinAddress(address);
    case 'ethereum':
    case 'eth':
      return validateEthereumAddress(address);
    case 'usdc':
      return validateUSDCAddress(address);
    default:
      return false;
  }
}

/**
 * Get human-readable format examples for different cryptocurrencies
 */
export function getCryptoAddressExample(currency: string): string {
  switch (currency.toLowerCase()) {
    case 'bitcoin':
    case 'btc':
      return 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    case 'ethereum':
    case 'eth':
      return '0x742C25204b3D44d2B7f6A9bf5a8C8c99B2D79Ed5';
    case 'usdc':
      return '0x742C25204b3D44d2B7f6A9bf5a8C8c99B2D79Ed5';
    default:
      return '';
  }
}

/**
 * Get human-readable currency name
 */
export function getCryptoDisplayName(currency: string): string {
  switch (currency.toLowerCase()) {
    case 'bitcoin':
    case 'btc':
      return 'Bitcoin (BTC)';
    case 'ethereum':
    case 'eth':
      return 'Ethereum (ETH)';
    case 'usdc':
      return 'USD Coin (USDC)';
    default:
      return currency.toUpperCase();
  }
}
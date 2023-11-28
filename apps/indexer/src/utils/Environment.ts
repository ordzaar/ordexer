export type EnvironmentNetwork = 'mainnet' | 'testnet' | 'regtest';

export const isEnvironmentNetwork = (value: any): value is EnvironmentNetwork =>
  value === 'mainnet' || value === 'testnet' || value === 'regtest';

// Network + contract configuration.
// Fill in REGISTRY_CONTRACT_ID and TRANSLOG_CONTRACT_ID after running scripts/deploy.sh
export const NETWORK = {
  network: 'TESTNET',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
};

export const CONTRACTS = {
  REGISTRY_CONTRACT_ID: import.meta.env.VITE_REGISTRY_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  TRANSLOG_CONTRACT_ID: import.meta.env.VITE_TRANSLOG_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
};

#!/usr/bin/env bash
# Deploys the TransferLog and ProductRegistry contracts to Stellar Testnet.
#
# Prerequisites:
#   - Stellar CLI installed: https://developers.stellar.org/docs/tools/cli
#   - A funded testnet identity: `stellar keys generate deployer --network testnet --fund`
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh

set -euo pipefail

NETWORK="testnet"
IDENTITY="deployer"

echo "==> Building contracts"
stellar contract build

echo "==> Deploying TransferLog contract"
TRANSLOG_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/transfer_log.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "TransferLog deployed at: $TRANSLOG_ID"

echo "==> Deploying ProductRegistry contract"
REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/product_registry.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "ProductRegistry deployed at: $REGISTRY_ID"

echo "==> Initializing TransferLog (authorizing the Registry contract to call it)"
stellar contract invoke \
  --id "$TRANSLOG_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- initialize \
  --registry "$REGISTRY_ID"

echo ""
echo "=================================================="
echo " Deployment complete"
echo "=================================================="
echo " TransferLog contract ID:    $TRANSLOG_ID"
echo " ProductRegistry contract ID: $REGISTRY_ID"
echo ""
echo " Next steps:"
echo " 1. Add these IDs to frontend/.env as VITE_TRANSLOG_CONTRACT_ID and VITE_REGISTRY_CONTRACT_ID"
echo " 2. Run scripts/sample_interaction.sh to register a product for your submission's tx hash"
echo "=================================================="

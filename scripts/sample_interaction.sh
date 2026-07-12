#!/usr/bin/env bash
# Runs an end-to-end interaction against deployed testnet contracts so you
# have a real transaction hash for the submission checklist: register a
# product, then transfer its custody once.
#
# Fill in these values after running deploy.sh:
REGISTRY_ID="REPLACE_WITH_REGISTRY_CONTRACT_ID"
TRANSLOG_ID="REPLACE_WITH_TRANSLOG_CONTRACT_ID"
MANUFACTURER_IDENTITY="deployer"
DISTRIBUTOR_ADDRESS="REPLACE_WITH_A_TESTNET_ADDRESS"

set -euo pipefail

MANUFACTURER_ADDRESS="$(stellar keys address $MANUFACTURER_IDENTITY)"

echo "==> Registering a sample product"
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source "$MANUFACTURER_IDENTITY" \
  --network testnet \
  -- register_product \
  --manufacturer "$MANUFACTURER_ADDRESS" \
  --name "Leather Wallet — Chestnut" \
  --serial_number "SN-00042" \
  --transfer_log "$TRANSLOG_ID"

echo ""
echo "==> Transferring custody to a distributor (assumes product_id 0; adjust if not)"
stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source "$MANUFACTURER_IDENTITY" \
  --network testnet \
  -- transfer_custody \
  --product_id 0 \
  --to "$DISTRIBUTOR_ADDRESS" \
  --location "Regional distribution center"

echo ""
echo "Copy the transaction hashes printed above into your README / submission form."

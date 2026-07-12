# Provenance — On-Chain Product Authenticity Tracker

Scan a product, see everywhere it's been. A manufacturer registers a
physical item with a serial number; every ownership handoff after that —
distributor, retailer, consumer, any resale — is appended to a tamper-evident
on-chain log. A counterfeit can copy the packaging. It cannot produce a
matching chain-of-custody history.

Built for the Stellar Orange Belt submission — supply-chain provenance is a
distinct domain from payment escrow, ticketing, or barter.

---

## Why this project

Anti-counterfeiting today mostly relies on holograms and serial numbers
printed on packaging — both trivially reproducible. What's much harder to
fake is a consistent, timestamped chain of custody recorded by independent
parties along the way. This project puts that chain on-chain:

- **The registry and the log are separate contracts on purpose.** The Registry owns *current* state (who owns it now, is it flagged); the TransferLog is an independent, append-only witness to *how it got there*. Splitting them means the history can't be quietly rewritten by whoever controls current ownership.
- **Anyone can flag a suspected counterfeit.** A consumer who scans a duplicate serial number in the wild can mark it — permanently, publicly — without needing the manufacturer's cooperation.
- **Verification is read-only and free.** Anyone can scan and check authenticity without a wallet or a transaction; only registering and transferring require signing.

---

## Architecture

```
Manufacturer / Supply chain party          Consumer
        │                                     │
        ▼                                     ▼
         React frontend (QR scan/generate, verification seal, live feed)
                          │
                          ▼
              ProductRegistry contract ──────► TransferLog contract
              (register, transfer, flag)        (append-only custody history)
```

**Inter-contract communication**: the Registry contract calls into
TransferLog on every `transfer_custody` call, via `record_transfer`
(`contracts/registry/src/lib.rs`). The TransferLog contract requires
`registry.require_auth()`, so only the authorized Registry instance can
append to any product's history — a consumer's frontend can read the log
directly and trust that every entry came through the Registry's own
transfer logic, never written directly.

**Event streaming**: every state change (`ProductRegistered`,
`CustodyTransferred`, `ProductFlagged`) is emitted as a Soroban contract
event. The frontend's `useContractEvents` hook polls `getEvents` on a short
interval and renders a live activity feed — useful for a manufacturer or
distributor dashboard watching shipments move in real time.

---

## Project structure

```
provenance/
├── contracts/
│   ├── registry/          # Main contract: register, transfer, flag
│   │   └── src/
│   │       ├── lib.rs
│   │       └── test.rs    # 6 unit tests
│   └── translog/            # Append-only custody history, called cross-contract
│       └── src/
│           ├── lib.rs
│           └── test.rs    # 6 unit tests
├── frontend/
│   ├── src/
│   │   ├── components/     # VerificationSeal, QRScanner, EventFeed, forms
│   │   ├── hooks/          # useWallet, useContractEvents
│   │   ├── contracts/      # registryClient.js, config.js
│   │   └── test/           # Vitest + Testing Library specs
│   └── package.json
├── scripts/
│   ├── deploy.sh               # Deploys + initializes both contracts to testnet
│   └── sample_interaction.sh   # Registers a product + one transfer for a demo tx hash
├── .github/workflows/ci.yml    # CI: contract tests + frontend tests + build
└── vercel.json
```

---

## Smart contract design

### ProductRegistry contract (`contracts/registry`)

| Function | Caller | What it does |
|---|---|---|
| `register_product` | Manufacturer | Registers a new product; manufacturer starts as owner |
| `transfer_custody` | Current owner | Cross-contract call to TransferLog, then updates current owner |
| `flag_counterfeit` | Anyone | Permanently flags a product as suspected counterfeit |
| `get_product` | Anyone (read-only) | Returns product state including flag status |

### TransferLog contract (`contracts/translog`)

| Function | Caller | What it does |
|---|---|---|
| `initialize` | Deployer | Authorizes the one Registry contract permitted to append entries |
| `record_transfer` | Registry contract only | Appends a `{from, to, location, timestamp}` entry |
| `get_history` | Anyone (read-only) | Returns the full ownership timeline for a product |
| `hop_count` | Anyone (read-only) | Returns how many times a product has changed hands |

Errors are typed contract errors (`RegistryError`, `TransferLogError`)
rather than panics, so the frontend gets a clean, catchable failure reason
instead of a raw trap.

---

## Frontend

- **React 18 + Vite + Tailwind**, mobile-first, styled around a security-
  document/verification-seal metaphor — a binary "verified" vs "flagged"
  state that reads unambiguously at a glance, not a soft "trust score."
- **Wallet connect** via Stellar Wallets Kit (Freighter, xBull, Albedo, etc.).
- **Scan-to-verify**: a registered product's QR code encodes its product ID;
  the Verify view uses the device camera (`jsQR`) to scan it and pull both
  the current status and the full custody timeline, with manual-entry
  fallback for camera-denied devices.
- **Three views**: Verify (scan/check), Register (manufacturer onboarding),
  Transfer (custody handoff + QR regeneration).
- **Live activity feed** driven by `useContractEvents` (polls Soroban RPC `getEvents`).
- **Error and loading states** throughout: skeleton loaders while verifying,
  dismissible error/success banners, disabled buttons mid-transaction.

### Environment variables

Copy `frontend/.env.example` to `frontend/.env` and fill in the contract IDs
from `scripts/deploy.sh`:

```
VITE_REGISTRY_CONTRACT_ID=
VITE_TRANSLOG_CONTRACT_ID=
```

---

## Running locally

### Contracts

```bash
# Requires Rust + wasm32-unknown-unknown target + Stellar CLI
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cargo test --workspace          # run all contract tests
stellar contract build           # build .wasm files
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # local dev server
npm run test      # Vitest unit tests
npm run build     # production build
```

---

## Deployment (testnet)

```bash
stellar keys generate deployer --network testnet --fund
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This builds both contracts, deploys them to Stellar Testnet, initializes
TransferLog to authorize the Registry contract, and prints both contract
IDs.

Then run the sample interaction script to register a demo product and
transfer it once, generating real transaction hashes for your submission:

```bash
chmod +x scripts/sample_interaction.sh
# fill in the contract IDs and a distributor address at the top of the script first
./scripts/sample_interaction.sh
```

Deploy the frontend to Vercel/Netlify pointing at `frontend/` as the root
(see `vercel.json`), with the two `VITE_*` env vars set in the dashboard.

---

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Contracts job** — builds both contracts to `wasm32-unknown-unknown` and runs `cargo test --workspace`.
2. **Frontend job** — installs deps, lints, runs Vitest, builds the production bundle.
3. **Deploy-readiness job** — gates on both passing before signaling the build is deploy-ready.

---

## Testing

- **Contracts**: 12 Rust unit tests total (6 in `registry`, 6 in `translog`) covering registration, multi-hop custody chains, counterfeit flagging, double-flag rejection, and not-found cases. Run with `cargo test --workspace`.
- **Frontend**: Vitest + React Testing Library specs for the verification seal's binary state and the product registration form. Run with `npm run test` inside `frontend/`.

---

## Submission checklist mapping

| Requirement | Where |
|---|---|
| Inter-contract communication | `registry::transfer_custody` calls into `translog::record_transfer` |
| Event streaming & real-time updates | Contract events + `useContractEvents` polling hook |
| CI/CD pipeline | `.github/workflows/ci.yml` |
| Deployment workflow | `scripts/deploy.sh` |
| Mobile responsive frontend | Tailwind responsive layout + camera-based QR scan view, phone-first |
| Error handling & loading states | `Banner.jsx`, `Skeleton.jsx`, try/catch in `App.jsx` |
| Tests (contracts + frontend) | `contracts/*/src/test.rs`, `frontend/src/test/*.test.jsx` |
| Documentation | This README + inline doc comments in every contract |

---

## License

MIT

# TrustLance

TrustLance is a Stellar-based freelance escrow platform.  
It helps clients and freelancers lock funds safely, track escrow lifecycle states, and settle payments through connected wallets.

![TrustLance Hero](./frontend/public/landing/hero-trustlance-v2.png)

## Highlights

- Multi-wallet connect flow (Freighter, xBull, Albedo, LOBSTR, Rabet, Hana, Hot Wallet, Klever)
- Escrow lifecycle actions: create, fund, release, refund
- Stellar payment flow for direct XLM transfers
- Dashboard for escrow contracts, transactions, and wallet/network settings
- Persistent local dashboard records via Zustand stores
- Modern Next.js frontend with App Router and shadcn-style UI primitives

## Tech Stack

- Next.js `16`
- React `19`
- TypeScript
- Tailwind CSS `v4`
- Zustand
- Stellar SDK + Freighter API + Stellar Wallets Kit

## Repository Structure

```text
.
├── frontend/                 # Next.js app
│   ├── app/                  # Routes (landing, dashboard, pricing, features)
│   ├── components/           # UI + feature components
│   ├── lib/stellar/          # Wallet, transaction, and contract helpers
│   └── store/                # Zustand stores
├── trustLance/               # Soroban Rust workspace
│   └── contracts/escrow/     # Escrow smart contract
├── scripts/                  # Utility scripts
└── docs/                     # Project docs
```

## Quick Start (Frontend)

### 1) Prerequisites

- Node.js `20+`
- `pnpm`
- A Stellar wallet extension (Freighter recommended)

### 2) Install and run

```bash
git clone <your-repo-url>
cd stellar-connect-wallet/frontend
pnpm install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
```

Start dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Frontend Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run local dev server |
| `pnpm build` | Build production app |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Wallet + Network Notes

- Wallet connection and signing are handled through Stellar Wallets Kit and Freighter API.
- Balance fetch uses Horizon (`NEXT_PUBLIC_HORIZON_URL`).
- Escrow actions require a deployed contract ID in `NEXT_PUBLIC_ESCROW_CONTRACT_ID`.
- Recommended network for development is `TESTNET`.

## Dashboard Data Notes

- Wallet balance and signed transactions are real network interactions.
- Dashboard records (escrows/transfers) are stored in local persisted Zustand stores.
- Dashboard analytics are computed from those stored records.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Overview and analytics |
| `/dashboard/escrow` | Create escrow |
| `/dashboard/escrow-contracts` | Manage escrow contracts |
| `/dashboard/transactions` | Send/receive + history |
| `/dashboard/settings` | Wallet/network/preferences |
| `/features`, `/how-it-works`, `/pricing` | Marketing pages |

## Smart Contract Workspace

Soroban contract code lives in:

- `trustLance/contracts/escrow`

Use Cargo from the `trustLance` workspace to build/test contract code.

## Contributing

Contributions are welcome.  
Open an issue first for significant feature or architectural changes.

## License

MIT

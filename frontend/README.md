# TrustLance Frontend

Frontend app for TrustLance, built with Next.js App Router, TypeScript, Tailwind CSS, and Stellar wallet integrations.

For full project documentation, see the root README:

- [../README.md](../README.md)

## Quick Start

```bash
cd frontend
pnpm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
```

Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Key Directories

```text
frontend/
├── app/
├── components/
├── lib/
│   └── stellar/
└── store/
```

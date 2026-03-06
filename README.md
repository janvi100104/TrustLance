# TrustLance - Freelance Escrow Platform

TrustLance is a blockchain-based escrow platform built on Stellar that enables secure freelance payments with lower fees and instant settlements.

## Features

- Wallet connection with Freighter
- XLM balance display
- Simple escrow creation
- Funding and payment release
- Multi-wallet support
- Real-time status tracking

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- @stellar/stellar-sdk
- @stellar/freighter-api
- @creit.tech/stellar-wallets-kit
- Zustand for state management
- Sonner for notifications

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd stellar-connect-wallet
   ```

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

5. Run the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setup Instructions

1. Install the [Freighter wallet extension](https://chrome.google.com/webstore/detail/freighter/xexzokzghmdukkyscdfjteluazmyijvw)
2. Create a testnet account using the [Stellar Laboratory](https://laboratory.stellar.org/) or [Stellar Quest faucet](https://dashboard.stellar.org/)
3. Fund your testnet account with testnet lumens using the faucet
4. Connect your wallet to the application

## Project Structure

- `frontend/app/page.tsx` - Main landing page
- `frontend/components/wallet/` - Wallet-related components
- `frontend/components/escrow/` - Escrow functionality components
- `frontend/store/useWallet.ts` - Wallet state management
- `frontend/lib/utils.ts` - Utility functions

## Level 1 Features (White Belt)

- ✅ Wallet connection with Freighter
- ✅ Display wallet address (truncated)
- ✅ Show XLM balance
- ✅ Simple payment form
- ✅ Create simple escrow
- ✅ Fund escrow functionality
- ✅ Release payment functionality
- ✅ Success/error notifications
- ✅ Mobile responsive design

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Wallet connected state:
<img width="1792" height="787" alt="Screenshot 2026-03-06 191517" src="https://github.com/user-attachments/assets/8426fcd0-f05e-4b20-bb77-d209dbcfaa5e" />

Balance displayed
<img width="1835" height="890" alt="Screenshot 2026-03-06 191553" src="https://github.com/user-attachments/assets/bb5b43b0-42c1-4acf-92ad-daf9bd0c1101" />

Successful testnet transaction
<img width="1854" height="893" alt="Screenshot 2026-03-06 191650" src="https://github.com/user-attachments/assets/31cc9b10-cdf1-4244-a58c-36efdd1c1373" />

The transaction result is shown to the user
<img width="1802" height="801" alt="Screenshot 2026-03-06 191808" src="https://github.com/user-attachments/assets/d8d5d2f2-c8ef-4b21-a6f7-f6a2190532c2" />

## License

MIT

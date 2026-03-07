# 🔍 Investigation: Dummy Data on Dashboard

**Date:** March 7, 2026  
**Issue:** Dashboard shows dummy/simulated data despite Soroban contract being deployed

---

## ✅ What's Working

| Component | Status | Details |
|-----------|--------|---------|
| Contract Deployment | ✅ **WORKING** | Contract ID: `CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN` |
| Environment Config | ✅ **WORKING** | `NEXT_PUBLIC_ESCROW_CONTRACT_ID` set in `.env.local` |
| Payment (XLM) | ✅ **WORKING** | Real Stellar Horizon transactions |
| Wallet Connection | ✅ **WORKING** | Freighter integration functional |
| Fund/Release/Refund | ⚠️ **PARTIAL** | Code exists but untested |

---

## ❌ Root Cause: Fake Escrow Creation

### **Problem Location:** `frontend/lib/stellar/contract.ts` (Line ~215)

```typescript
export async function initializeEscrow(
  params: EscrowInitializationParams
): Promise<ContractCallResult> {
  // ... validation code ...

  const publicKey = addressResult.address!;

  // ❌ PROBLEM: This comment reveals the issue
  // NOTE: Soroban SDK v14 has breaking changes in Contract.call() serialization
  // For now, create escrow locally. Real Soroban integration requires SDK v11 or custom serialization
  // TODO: Fix Soroban integration when SDK stabilizes

  // ❌ PROBLEM: Returns FAKE data instead of calling contract
  return {
    success: true,
    transactionHash: 'local-' + Date.now(),  // ← FAKE hash
    result: BigInt(Date.now()),              // ← FAKE escrow ID
  };
}
```

### **Why This Causes Dummy Data:**

1. User creates escrow → `CreateEscrowForm` calls `initializeEscrow()`
2. `initializeEscrow()` returns **fake transaction hash** and **fake escrow ID**
3. Escrow data stored in **Zustand store** (browser localStorage)
4. Dashboard reads from Zustand store → shows "dummy" data
5. **No actual contract interaction occurs**

---

## 📊 Current Flow vs Expected Flow

### **Current (Broken) Flow:**
```
User clicks "Create Escrow"
    ↓
Validate inputs
    ↓
Call initializeEscrow()
    ↓
❌ Returns local mock data (NO contract call)
    ↓
Store in Zustand (localStorage)
    ↓
Dashboard shows data from localStorage
```

### **Expected (Working) Flow:**
```
User clicks "Create Escrow"
    ↓
Validate inputs
    ↓
Call initializeEscrow()
    ↓
✅ Build Soroban transaction
✅ Sign with Freighter
✅ Submit to RPC
✅ Contract creates escrow on-chain
✅ Returns real transaction hash
    ↓
Store in Zustand + On-chain data
    ↓
Dashboard shows REAL on-chain escrow
```

---

## 🛠️ Required Fixes

### **Fix 1: Implement Real `initializeEscrow()`**

The function needs to actually call the Soroban contract:

```typescript
export async function initializeEscrow(
  params: EscrowInitializationParams
): Promise<ContractCallResult> {
  try {
    // ... existing validation ...

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    // ✅ Build Soroban operation with proper argument serialization
    const operation = contract.call(
      'initialize',
      new Address(params.freelancerAddress),  // Use Address type
      params.amount,
      params.deadline,
      params.metadata
    );

    // ✅ Build and submit transaction
    const txResult = await buildAndSubmitTransaction(
      contract,
      'initialize',
      [
        new Address(params.freelancerAddress),
        params.amount,
        params.deadline,
        params.metadata
      ],
      publicKey
    );

    return {
      success: true,
      transactionHash: txResult.hash,
      result: txResult.result,  // Real escrow ID from contract
    };
  } catch (error: any) {
    // ... existing error handling ...
  }
}
```

### **Fix 2: Fix `buildAndSubmitTransaction()` Argument Serialization**

The issue mentioned in the comment is likely about how arguments are serialized. Soroban SDK v14+ requires proper `xdr.ScVal` types:

```typescript
async function buildAndSubmitTransaction(
  contract: Contract,
  method: string,
  args: any[],
  publicKey: string
): Promise<{ hash: string; result?: any }> {
  const account = await server.getAccount(publicKey);

  // ✅ Use proper ScVal serialization for arguments
  const operation = contract.call(method, ...args);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: {
      minTime: 0,
      maxTime: Math.floor(Date.now() / 1000) + 30,
    },
  })
    .addOperation(operation)
    .build();

  tx = await server.prepareTransaction(tx);

  const signedTx = await freighter.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedTxXDR = typeof signedTx === 'string' ? signedTx : signedTx.signedTransactionXdr;
  const parsedTx = TransactionBuilder.fromXDR(signedTxXDR, NETWORK_PASSPHRASE) as Transaction;

  const sendResponse = await server.sendTransaction(parsedTx);

  // ... wait for completion ...
}
```

### **Fix 3: Fetch Escrows from Contract (Optional Enhancement)**

Currently, the dashboard only shows escrows created in the current session (from localStorage). To show ALL escrows from the blockchain:

```typescript
// New function to fetch escrows from contract events
export async function getUserEscrows(address: string): Promise<EscrowData[]> {
  const contract = getEscrowContract();

  // Query contract events for this user
  const events = await server.getEvents({
    startLedger: 1,
    filters: [
      {
        contractIds: [contract.contractId()],
        type: 'contract',
      },
    ],
  });

  // Filter events for this user and parse escrow data
  // ...
}
```

---

## 🧪 Testing After Fix

### **1. Test Escrow Creation:**
```bash
cd frontend
pnpm dev

# In browser:
1. Connect wallet
2. Go to Dashboard → Create Escrow
3. Fill form with test data
4. Click "Create Escrow"
5. Sign transaction in Freighter
6. Verify:
   - Real transaction hash shown (64-char hex, not "local-...")
   - Link to Stellar Expert works
   - Transaction visible on blockchain
```

### **2. Verify On-Chain:**
```bash
# Check escrow count increased
stellar contract invoke \
  --id CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN \
  --network testnet \
  --source testnet_deployer \
  -- get_escrow_count

# Should show 1 (or more) after creating escrow
```

### **3. Test Full Flow:**
1. ✅ Create escrow (real contract call)
2. ✅ Fund escrow (real contract call)
3. ✅ Release payment (real contract call)
4. ✅ View on Stellar Expert

---

## 📝 Additional Issues Found

### **Issue 2: Dashboard Hardcoded Sample Data**

**File:** `frontend/app/dashboard/page.tsx` (Line ~34)

```typescript
// Sample escrow data
const sampleEscrows = [
  {
    id: 'ESC-001',
    title: 'Website Redesign',
    client: 'GBDZ...542F',
    freelancer: 'GAJK...44QP',
    amount: 100,
    status: 'funded',
    createdAt: '2024-01-15',
  },
  // ...
];
```

**Status:** This is **NOT the problem** - it's just unused legacy code. The dashboard actually uses `userEscrows` from Zustand store.

### **Issue 3: No Contract Event Listening**

The app doesn't listen for contract events, so:
- Escrows created externally won't appear
- Status updates from contract aren't reflected
- Need to refresh to see changes

**Solution:** Implement event listeners using `server.getEvents()`

---

## 🎯 Priority Fixes

| Priority | Fix | Impact |
|----------|-----|--------|
| **P0** | Fix `initializeEscrow()` to call real contract | Critical - enables real escrow creation |
| **P1** | Test fund/release/refund with real contract | High - complete escrow lifecycle |
| **P2** | Add contract event listeners | Medium - real-time updates |
| **P3** | Fetch historical escrows from contract | Medium - show all user escrows |
| **P4** | Remove unused sample data | Low - code cleanup |

---

## 💡 Why Flow "Seems" Working

The flow appears to work because:

1. ✅ **UI interactions work** - buttons click, forms validate
2. ✅ **Local state updates** - Zustand store updates immediately
3. ✅ **Payment works** - XLM payments use real Horizon API
4. ❌ **Escrow is fake** - no on-chain interaction

**Result:** Users can create "escrows" that exist only in browser storage, not on the blockchain!

---

## 🔗 Related Files

- `frontend/lib/stellar/contract.ts` - **Main issue location**
- `frontend/components/escrow/CreateEscrowForm.tsx` - Uses contract functions
- `frontend/components/escrow/EscrowCard.tsx` - Fund/Release/Refund actions
- `frontend/store/useEscrowStore.ts` - Local state management
- `frontend/app/dashboard/page.tsx` - Dashboard UI
- `frontend/.env.local` - Contract configuration

---

## ✅ Success Criteria

After fixing, verify:

- [ ] Transaction hash is 64-character hex (not "local-...")
- [ ] Transaction visible on Stellar Expert
- [ ] Escrow count increases after creation
- [ ] Fund/Release/Refund work with real contract
- [ ] Escrow status matches on-chain state
- [ ] No more "dummy" or simulated data

---

**Next Step:** Fix `initializeEscrow()` in `frontend/lib/stellar/contract.ts` to make real Soroban contract calls.

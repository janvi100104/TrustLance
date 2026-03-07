# 🔧 Fix Plan: Complete Soroban Integration

**Goal:** Make everything work perfectly with real Soroban contract calls
**Date:** March 7, 2026

---

## 📋 Current Issues

1. **Soroban SDK v14.5.0 Breaking Changes**
   - `SorobanRpc.Server` doesn't exist in v14
   - Need to use new API structure

2. **Contract Integration Not Working**
   - `initializeEscrow()` returns dummy data
   - No real blockchain transactions

3. **Multiple Wallet Connection Working** ✅
   - Freighter connects successfully
   - xBull connects successfully
   - Installation detection works

---

## ✅ What's Already Working

- ✅ Multi-wallet connection (Freighter, xBull, etc.)
- ✅ Wallet installation detection
- ✅ Local escrow storage (Zustand)
- ✅ UI components (CreateEscrowForm, EscrowCard)
- ✅ Contract deployed to testnet: `CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN`

---

## 🔴 What Needs to Be Fixed

### Phase 1: Fix Soroban SDK Integration (Priority: CRITICAL)

**Problem:** SDK v14.5.0 has breaking API changes

**Solution Options:**

#### Option A: Downgrade to Compatible SDK Version
```bash
cd frontend
npm uninstall @stellar/stellar-sdk
npm install @stellar/stellar-sdk@11.3.0
```

**Pros:**
- Known working API
- Stable SorobanRpc.Server
- Minimal code changes

**Cons:**
- Miss out on v14 features
- Will need upgrade later

#### Option B: Update Code for SDK v14 API
**New API in v14:**
```typescript
import { SorobanRpc } from '@stellar/stellar-sdk';

// Old (v11):
const server = new SorobanRpc.Server(RPC_URL);

// New (v14):
const server = new SorobanRpc(RPC_URL);
// OR
const server = SorobanRpc.create(RPC_URL);
```

**Steps:**
1. Check actual v14 API documentation
2. Update all `server.method()` calls
3. Fix transaction building for v14
4. Test all contract functions

**Recommended:** Option B (proper fix for current version)

---

### Phase 2: Implement Real Contract Calls (Priority: CRITICAL)

**Functions to Implement:**

1. **initializeEscrow()**
   - Build Soroban transaction
   - Call contract's `initialize()` function
   - Sign with Freighter
   - Submit to network
   - Return escrow ID

2. **fundEscrow()**
   - Build transaction with payment attachment
   - Call contract's `fund()` function
   - Transfer XLM to contract
   - Update escrow status

3. **releasePayment()**
   - Call contract's `release_payment()` function
   - Transfer from contract to freelancer
   - Update status

4. **refundEscrow()**
   - Call contract's `refund()` function
   - Transfer from contract to client
   - Update status

5. **getEscrowDetails()**
   - Read-only call via simulation
   - Return escrow data from contract

6. **getEscrowCount()**
   - Read-only call
   - Return total escrows

---

### Phase 3: Transaction Flow (Priority: HIGH)

**Complete Flow:**

```
User Creates Escrow
    ↓
Validate Inputs
    ↓
Build Soroban Transaction
  - Contract.call('initialize', ...)
  - Add memo, source, fee
    ↓
Prepare Transaction
  - server.prepareTransaction(tx)
  - Simulates and adds resources
    ↓
Sign with Freighter
  - freighter.signTransaction(xdr)
  - User approves in popup
    ↓
Submit Transaction
  - server.sendTransaction(signedTx)
  - Get transaction hash
    ↓
Wait for Completion
  - Poll server.getTransaction(hash)
  - Wait for SUCCESS status
    ↓
Extract Result
  - Parse return value (escrow ID)
  - Store in local state
    ↓
Show Success
  - Display transaction hash
  - Link to Stellar Expert
```

---

### Phase 4: Error Handling (Priority: HIGH)

**Error Types to Handle:**

1. **Wallet Errors**
   - Not connected
   - User rejected
   - Wrong network

2. **Contract Errors**
   - Escrow not found
   - Invalid state transition
   - Unauthorized access

3. **Transaction Errors**
   - Insufficient balance
   - Invalid sequence number
   - Network timeout

4. **Validation Errors**
   - Invalid address
   - Invalid amount
   - Invalid deadline

---

## 📝 Implementation Steps

### Step 1: Check SDK v14 API (30 minutes)

```bash
# Check what's available in installed SDK
cd frontend
node -e "const sdk = require('@stellar/stellar-sdk'); console.log(Object.keys(sdk.SorobanRpc))"
```

**Expected Output:**
```
['Server', 'Api', 'assembleTransaction', ...]
```

If `Server` exists, use it. If not, find correct constructor.

---

### Step 2: Fix Server Initialization (15 minutes)

**File:** `lib/stellar/contract.ts`

```typescript
import { SorobanRpc } from '@stellar/stellar-sdk';

// Correct initialization for v14
const server = new SorobanRpc.Server(SOROBAN_RPC_URL);
// OR if that fails:
const server = new SorobanRpc(SOROBAN_RPC_URL);
```

---

### Step 3: Implement buildAndSubmitTransaction (1 hour)

**File:** `lib/stellar/contract.ts`

```typescript
async function buildAndSubmitTransaction(
  contract: Contract,
  method: string,
  args: any[],
  publicKey: string
): Promise<{ hash: string; result?: any }> {
  const account = await server.getAccount(publicKey);
  
  const operation = contract.call(method, ...args);
  
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();
  
  tx = await server.prepareTransaction(tx);
  
  const signedTx = await freighter.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  
  const sendResponse = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTx.signedTransactionXdr, NETWORK_PASSPHRASE)
  );
  
  let txResponse = await server.getTransaction(sendResponse.hash);
  while (txResponse.status === 'NOT_FOUND') {
    await sleep(1000);
    txResponse = await server.getTransaction(sendResponse.hash);
  }
  
  return {
    hash: sendResponse.hash,
    result: txResponse.returnValue,
  };
}
```

---

### Step 4: Update initializeEscrow (30 minutes)

**File:** `lib/stellar/contract.ts`

Replace the temporary return with real contract call:

```typescript
const contract = getEscrowContract();
const args = [
  new Address(freelancerAddress),
  amount,
  deadline,
  metadata,
];

const txResult = await buildAndSubmitTransaction(
  contract,
  'initialize',
  args,
  publicKey
);

const escrowId = txResult.result.value();

return {
  success: true,
  transactionHash: txResult.hash,
  result: escrowId,
};
```

---

### Step 5: Implement fundEscrow with Payment (1 hour)

**Challenge:** Attaching XLM payment to contract call

**Solution:** Use `invokeHostFunction` with payment operation

```typescript
async function fundEscrow(
  escrowId: bigint,
  amount: bigint
): Promise<ContractCallResult> {
  const contract = getEscrowContract();
  
  // Build contract call
  const callOperation = contract.call('fund', escrowId);
  
  // Build payment operation (XLM transfer to contract)
  const paymentOperation = Payment.payment({
    destination: ESCROW_CONTRACT_ID,
    amount: stroopsToXlm(amount).toString(),
  });
  
  // Combine operations
  const tx = new TransactionBuilder(account, {...})
    .addOperation(callOperation)
    .addOperation(paymentOperation)
    .build();
  
  // ... rest of flow
}
```

---

### Step 6: Test All Functions (2 hours)

**Test Checklist:**

1. **Create Escrow**
   - [ ] Connect wallet
   - [ ] Fill form
   - [ ] Submit
   - [ ] Get transaction hash
   - [ ] Verify on Stellar Expert

2. **Fund Escrow**
   - [ ] Select created escrow
   - [ ] Click "Fund"
   - [ ] Approve payment
   - [ ] Status changes to "Funded"

3. **Release Payment**
   - [ ] Select funded escrow
   - [ ] Click "Release"
   - [ ] Approve transaction
   - [ ] Freelancer receives funds

4. **Request Refund**
   - [ ] Wait for deadline
   - [ ] Click "Refund"
   - [ ] Client receives funds

---

### Step 7: Update UI Components (30 minutes)

**Files to Update:**

- `CreateEscrowForm.tsx` - Remove temporary code
- `EscrowCard.tsx` - Use real contract calls
- Remove all "demo mode" fallbacks

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] Create escrow creates real Soroban escrow
- [ ] Fund escrow transfers XLM to contract
- [ ] Release payment transfers to freelancer
- [ ] Refund transfers back to client
- [ ] All transactions visible on Stellar Expert
- [ ] No console errors
- [ ] No dummy/local escrows

### Technical Requirements
- [ ] TypeScript strict mode
- [ ] Proper error handling
- [ ] Loading states
- [ ] Transaction hash display
- [ ] Explorer links working

### User Experience
- [ ] Clear success messages
- [ ] Clear error messages
- [ ] Loading indicators
- [ ] Confirmation dialogs
- [ ] Mobile responsive

---

## ⏱️ Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Fix SDK Integration | 1 hour |
| 2 | Implement Contract Calls | 2 hours |
| 3 | Transaction Flow | 1 hour |
| 4 | Error Handling | 1 hour |
| 5 | Testing | 2 hours |
| **Total** | | **7 hours** |

---

## 🚀 Next Steps

1. **Check SDK v14 API** (now)
2. **Fix server initialization** (15 min)
3. **Implement buildAndSubmitTransaction** (1 hour)
4. **Update initializeEscrow** (30 min)
5. **Test escrow creation** (30 min)
6. **Implement fundEscrow** (1 hour)
7. **Test full flow** (1 hour)
8. **Polish UI** (30 min)

---

## 📞 Resources

- [Soroban SDK v14 Docs](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Our Deployed Contract](https://stellar.expert/explorer/testnet/contract/CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN)

---

**Ready to start! Which step should I begin with?**

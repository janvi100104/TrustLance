# 🔧 Debug Guide - Escrow Creation & Balance

**Date:** March 7, 2026

---

## 🐛 Issues to Debug

1. **Escrow not creating** - Transaction fails
2. **Balance not displaying** - Shows 0 or null

---

## 🧪 Step-by-Step Debugging

### **1. Open Browser Console**

Press `F12` or `Ctrl+Shift+I` (Cmd+Option+I on Mac) → Go to **Console** tab

### **2. Connect Wallet**

Click "Connect Wallet" → Select Freighter → Approve

**Expected Console Output:**
```
[Wallet] Kit initialized
[Contract] Building transaction for method: ...
```

### **3. Check Balance**

After connecting, check console for:
```
[Contract] Account fetched: G...
```

Then check if balance appears on dashboard.

**If balance is 0:**
- Your testnet account has no XLM
- Go to: https://friendbot.stellar.org/?addr=YOUR_ADDRESS
- Click "Submit"
- Wait 5 seconds
- Refresh dashboard

### **4. Try Creating Escrow**

Go to Dashboard → Create Escrow → Fill form:
- Project Title: "Test"
- Freelancer Address: `GCDVY3L4HAVXRXWBJ64RRXNTTUEGIWWMZTIBM2BWJYI4GWK4JCYW3SWA`
- Amount: 10
- Deadline: 7

Click "Create Escrow"

**Expected Console Output:**
```
[Contract] Building transaction for method: initialize
[Contract] Args: [ Address {...}, 100000000n, 604800n, "Test" ]
[Contract] Account fetched: G...
[Contract] Operation built
[Contract] Transaction built, preparing...
[Contract] Transaction prepared
[Contract] Transaction signed
[Contract] Submitting transaction...
[Contract] Transaction submitted: <64-char-hash>
[Contract] Waiting for confirmation...
[Contract] Transaction confirmed: SUCCESS
[Contract] Return value: ScVal {...}
```

### **5. Check for Errors**

**Common Errors:**

#### **"Do not know how to serialize a BigInt"**
```
Error: Do not know how to serialize a BigInt
    at JSON.stringify (<anonymous>)
```
**Status:** ✅ Should be fixed now  
**If still happens:** The SDK version might need updating

#### **"Transaction failed: UNKNOWN_ERROR"**
```
[Contract] Transaction error: Error: Transaction failed: UNKNOWN_ERROR
```
**Cause:** Contract call failed  
**Check:**
1. Contract ID correct? `CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN`
2. Enough XLM for fees? (~0.0001 XLM)
3. Network correct? (Testnet)

#### **"Account not found"**
```
Error: Account not found
```
**Cause:** Testnet account doesn't exist  
**Fix:** https://friendbot.stellar.org/?addr=YOUR_ADDRESS

#### **"Transaction submission failed: ERROR"**
```
Error: Transaction submission failed: ERROR
```
**Cause:** RPC issue or invalid transaction  
**Check:**
1. Freighter connected?
2. Correct network in Freighter? (Testnet)
3. Soroban RPC working? https://soroban-testnet.stellar.org

---

## 📊 What to Share for Help

If escrow creation still fails, copy these from console:

### **1. Full Error Stack Trace**
```
[Contract] Transaction error: <FULL ERROR>
<STACK TRACE>
```

### **2. Transaction Args**
```
[Contract] Args: [...]
```

### **3. Network/Account Info**
```
[Contract] Account fetched: G...
```

### **4. Environment Check**
```bash
cd frontend
cat .env.local | grep CONTRACT
```

Should show:
```
NEXT_PUBLIC_ESCROW_CONTRACT_ID=CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN
```

---

## ✅ Verification Checklist

- [ ] Console shows `[Contract] Building transaction for method: initialize`
- [ ] Console shows `[Contract] Args:` with 4 arguments
- [ ] Console shows `[Contract] Account fetched: G...`
- [ ] Console shows `[Contract] Transaction submitted:` with hash
- [ ] Console shows `[Contract] Transaction confirmed: SUCCESS`
- [ ] Toast shows "Escrow Created Successfully!"
- [ ] Transaction hash is 64 characters (not "local-...")
- [ ] "View on Explorer" link works
- [ ] Balance shows real XLM amount (not 0 if funded)

---

## 🔍 Balance Debug

### **Balance Shows 0**

**Possible Causes:**

1. **Account not funded**
   ```
   Solution: https://friendbot.stellar.org/?addr=YOUR_ADDRESS
   ```

2. **Wrong network**
   ```
   Check: Freighter → Settings → Network → Should be "Test Net"
   ```

3. **Balance fetch failed**
   ```
   Check console for: "Error fetching balance: ..."
   ```

4. **Wallet not connected**
   ```
   Check: Dashboard should show your address (G...xxx)
   ```

### **Balance Not Updating**

1. Open DevTools → Application → Local Storage
2. Find `trustlance-wallet`
3. Check if `publicKey` exists
4. If not, reconnect wallet

---

## 🚀 Quick Test Commands

### **Check Contract on Blockchain**
```bash
stellar contract invoke \
  --id CDUSAVT6JZFIGPSQAWCFOWEKFLIDEUL5D73OLWTTJRCOP6CMEFY2PXZN \
  --network testnet \
  -- get_escrow_count
```

Should return `0` or more.

### **Check Your Account**
```bash
curl https://horizon-testnet.stellar.org/accounts/YOUR_ADDRESS
```

Should return account data with balances.

---

## 📝 Next Steps

1. **Open browser console** (F12)
2. **Connect wallet**
3. **Try creating escrow**
4. **Copy ALL console output** starting with `[Contract]`
5. **Share the error message** if it fails

The console logs will show exactly where it's failing!

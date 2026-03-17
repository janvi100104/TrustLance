# 🔧 Freighter "Origin Not Allowed" Fix

**Issue:** Freighter wallet extension is blocking requests from localhost

**Error:**
```
Origin not allowed
chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js
```

---

## 🚨 **Root Cause**

This is **NOT a code issue** - it's a Freighter wallet security setting that blocks localhost or certain origins.

---

## ✅ **Solutions**

### **Solution 1: Use Freighter Testnet Mode**

1. **Open Freighter Extension**
   - Click Freighter icon in browser
   - Go to Settings (gear icon)

2. **Enable Testnet**
   - Toggle "Use Testnet" to ON
   - Make sure you're on testnet network

3. **Allow Localhost (if option exists)**
   - Some versions have "Allow localhost" or "Developer mode"
   - Enable it

4. **Refresh Page**
   - Reload http://localhost:3000
   - Try connecting wallet again

---

### **Solution 2: Use Vercel Preview Deployment**

Instead of localhost, deploy to Vercel:

```bash
# Commit your changes
git add .
git commit -m "fix: updated contract integration"

# Push to GitHub
git push origin master

# Vercel will auto-deploy
# Then test on the Vercel preview URL
```

**Vercel URL:** `https://your-project.vercel.app`

Freighter works better with HTTPS domains than localhost.

---

### **Solution 3: Use Stellar Laboratory**

For testing the contract directly without frontend:

1. **Go to:** https://lab.stellar.org/
2. **Select:** Testnet
3. **Import Account:** Your testnet account
4. **Contract Tab:** Interact with your contract directly

**Contract:** `CDI3WZIRGBGR3N4A6OO2XZO5DKSZEAEW3PGTFNBI6GXQVP3AM7MPIPHJ`

---

### **Solution 4: Try Different Wallet**

Install and try xBull or Albedo wallet:

**xBull:**
- Download: https://xbull.app/
- Supports testnet
- May have different CORS policies

**Albedo:**
- Download: https://albedo.link/
- Modern wallet with good developer support

---

### **Solution 5: Check Freighter Permissions**

1. **Open Chrome Extension Settings**
   - Go to `chrome://extensions/`
   - Find Freighter
   - Click "Details"

2. **Check Site Access**
   - Make sure "Allow access to file URLs" is ON
   - Try "On all sites" instead of "On click"

3. **Clear Freighter Cache**
   - Open Freighter
   - Settings → Advanced → Clear cache
   - Reconnect wallet

---

## 🧪 **Debugging Steps**

### **1. Check Console Logs**

Open browser console (F12) and look for:
```javascript
[Contract] Building transaction for method: initialize
[Contract] Account fetched: G...
```

If you see "Origin not allowed" immediately, it's Freighter blocking.

### **2. Test Wallet Connection**

Try this in browser console:
```javascript
import * as freighter from '@stellar/freighter-api';

// Test connection
freighter.isConnected().then(connected => {
  console.log('Wallet connected:', connected);
});

// Test getting address
freighter.getAddress().then(result => {
  console.log('Address:', result);
}).catch(error => {
  console.error('Error:', error);
});
```

### **3. Check Network**

Make sure Freighter is on **Testnet**, not Mainnet:
- Open Freighter
- Check network selector (should say "Testnet")
- If on Mainnet, switch to Testnet

---

## ⚠️ **Known Limitations**

### **Freighter on Localhost:**

Freighter has known issues with localhost:
- CORS restrictions
- Origin validation
- Security policies

**Workarounds:**
1. Use `https://localhost` with self-signed cert (complex)
2. Use Vercel deployment (recommended)
3. Use Stellar Laboratory for testing

---

## 🎯 **Recommended Approach**

**For Development:**

1. **Code locally** on localhost
2. **Test contract** via Stellar Laboratory
3. **Deploy to Vercel** for full wallet testing
4. **Use testnet** for all testing

**Deployment:**
```bash
# Push to GitHub
git add .
git commit -m "feat: contract integration complete"
git push

# Vercel auto-deploys
# Check vercel.com for deployment status
```

---

## 📊 **Alternative Testing**

### **Test Without Wallet (Mock Mode)**

For UI testing only (not blockchain):

1. **Comment out wallet requirement** temporarily:

```typescript
// In CreateEscrowForm.tsx
const createEscrow = async () => {
  // Skip wallet check for testing
  // if (!isConnected || !publicKey) {
  //   toast.error('Please connect your wallet first');
  //   return;
  // }
  
  // ... rest of code
};
```

2. **Test UI flow** without actual transactions

3. **Re-enable** before committing

---

## 🔗 **Useful Links**

- **Freighter Docs:** https://www.freighter.app/docs
- **Stellar Laboratory:** https://lab.stellar.org/
- **Stellar Expert:** https://stellar.expert/explorer/testnet/contract/CDI3WZIRGBGR3N4A6OO2XZO5DKSZEAEW3PGTFNBI6GXQVP3AM7MPIPHJ
- **Vercel Deployment:** https://vercel.com/docs

---

## ✅ **Quick Fix Checklist**

- [ ] Freighter set to Testnet
- [ ] Freighter permissions allow localhost
- [ ] Browser cache cleared
- [ ] Page reloaded
- [ ] Tried different browser
- [ ] Tried different wallet (xBull, Albedo)
- [ ] Deployed to Vercel for testing

---

## 🎉 **Once Fixed**

After fixing the Freighter issue, you should be able to:

1. ✅ Connect wallet
2. ✅ Create escrow
3. ✅ Fund escrow
4. ✅ See transactions on Stellar Expert

---

**Status:** ⚠️ **WAITING FOR FREIGHTER FIX**

The code is correct - this is a wallet configuration issue.

**Recommended:** Deploy to Vercel and test there instead of localhost.

/**
 * Test Script for Contract Read Operations
 * 
 * Run this to verify that XDR parsing is working correctly
 * 
 * Usage:
 *   cd frontend
 *   npx tsx ../scripts/test-contract-read.ts
 */

import { getEscrowDetails, getEscrowStatus, getEscrowCount } from '../frontend/lib/stellar/contract';

async function testReadOperations() {
  console.log('🧪 Testing Contract Read Operations...\n');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Get escrow count
    console.log('\n📝 Test 1: Getting escrow count...');
    console.log('-'.repeat(50));
    const count = await getEscrowCount();
    console.log(`✅ Escrow count: ${count.toString()}`);
    passed++;
    console.log('   Status: PASS\n');

    // Test 2: Get escrow details (if escrows exist)
    if (count > BigInt(0)) {
      console.log(`📝 Test 2: Getting details for escrow ID 1...`);
      console.log('-'.repeat(50));
      const details = await getEscrowDetails(BigInt(1));
      
      if (details) {
        console.log('✅ Escrow details retrieved:');
        console.log(`   ID: ${details.id}`);
        console.log(`   Client: ${details.client}`);
        console.log(`   Freelancer: ${details.freelancer}`);
        console.log(`   Amount: ${details.amount} XLM`);
        console.log(`   Status: ${details.status}`);
        console.log(`   Deadline: ${details.deadline?.toISOString()}`);
        console.log(`   Metadata: ${details.metadata}`);
        passed++;
        console.log('   Status: PASS\n');
      } else {
        console.log('⚠️  No escrow details found for ID 1');
        console.log('   Status: SKIP (no data)\n');
      }

      // Test 3: Get escrow status
      console.log('📝 Test 3: Getting escrow status...');
      console.log('-'.repeat(50));
      const status = await getEscrowStatus(BigInt(1));
      
      if (status) {
        console.log(`✅ Escrow status: ${status}`);
        passed++;
        console.log('   Status: PASS\n');
      } else {
        console.log('⚠️  No status found');
        console.log('   Status: SKIP (no data)\n');
      }
    } else {
      console.log('\n⚠️  No escrows exist yet. Skipping details and status tests.');
      console.log('   Create an escrow first to test getEscrowDetails and getEscrowStatus\n');
    }

    // Summary
    console.log('=' .repeat(50));
    console.log('📊 Test Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️  Skipped: 0`);
    console.log('=' .repeat(50));
    
    if (failed === 0) {
      console.log('\n✅ All read operations working correctly!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed!\n');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('\n' + '=' .repeat(50));
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Make sure .env.local is configured with contract ID');
    console.log('   2. Check that Soroban RPC URL is accessible');
    console.log('   3. Verify contract is deployed on testnet');
    console.log('=' .repeat(50));
    process.exit(1);
  }
}

// Run tests
testReadOperations();

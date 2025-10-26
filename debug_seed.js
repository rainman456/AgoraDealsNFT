const { BN } = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

// From your test output
const programId = new PublicKey("9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3");
const promotionPDA = new PublicKey("4y9xEC2873bCpAn7zHrfKuL3HLHnj62hFNmP2ApnSUM6");
const merchantPDA = new PublicKey("E6pYxmqvR8muJ8EkXQVVXEbLfPvMqDzyGyeu8RoyoYSQ");
const expected = "JDYhwrmPeThKPsNvBZgd4eRZmPffEhVBRhpCE564VxhL";

console.log("=== REVERSE ENGINEERING SEEDS ===");
console.log("Target PDA:", expected);
console.log("Program ID:", programId.toBase58());
console.log("Promotion PDA:", promotionPDA.toBase58());
console.log("Merchant PDA:", merchantPDA.toBase58());
console.log("");

function u64ToBytes(num) {
  const bn = new BN(num);
  return bn.toArrayLike(Buffer, 'le', 8);
}

// Try many combinations
console.log("Testing seed combinations...\n");

// Test 1: Standard approach with different counter values
console.log("1. ['coupon', promotion, counter]");
for (let i = 0; i < 50; i++) {
  const seeds = [Buffer.from("coupon"), promotionPDA.toBuffer(), u64ToBytes(i)];
  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  if (pda.toBase58() === expected) {
    console.log(`✓✓✓ FOUND IT! counter = ${i}`);
    console.log(`   Seeds: ['coupon', promotion, ${i}]`);
    console.log(`   Bytes: ${u64ToBytes(i).toString('hex')}`);
    process.exit(0);
  }
}

// Test 2: Maybe using merchant instead
console.log("2. ['coupon', merchant, counter]");
for (let i = 0; i < 50; i++) {
  const seeds = [Buffer.from("coupon"), merchantPDA.toBuffer(), u64ToBytes(i)];
  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  if (pda.toBase58() === expected) {
    console.log(`✓✓✓ FOUND IT! counter = ${i}`);
    console.log(`   Seeds: ['coupon', merchant, ${i}]`);
    process.exit(0);
  }
}

// Test 3: Maybe the seed order is different
console.log("3. [counter, 'coupon', promotion]");
for (let i = 0; i < 20; i++) {
  const seeds = [u64ToBytes(i), Buffer.from("coupon"), promotionPDA.toBuffer()];
  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  if (pda.toBase58() === expected) {
    console.log(`✓✓✓ FOUND IT! counter = ${i}`);
    process.exit(0);
  }
}

// Test 4: Maybe it's using a string instead of bytes
console.log("4. ['coupon', promotion, counter_as_string]");
for (let i = 0; i < 20; i++) {
  const seeds = [Buffer.from("coupon"), promotionPDA.toBuffer(), Buffer.from(i.toString())];
  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  if (pda.toBase58() === expected) {
    console.log(`✓✓✓ FOUND IT! counter = ${i} (as string)`);
    process.exit(0);
  }
}

// Test 5: Maybe using both merchant and promotion
console.log("5. ['coupon', merchant, promotion, counter]");
for (let i = 0; i < 10; i++) {
  const seeds = [Buffer.from("coupon"), merchantPDA.toBuffer(), promotionPDA.toBuffer(), u64ToBytes(i)];
  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  if (pda.toBase58() === expected) {
    console.log(`✓✓✓ FOUND IT! counter = ${i}`);
    process.exit(0);
  }
}

// Test 6: Maybe no counter at all, just promotion
console.log("6. ['coupon', promotion] (no counter)");
const seeds6 = [Buffer.from("coupon"), promotionPDA.toBuffer()];
const [pda6] = PublicKey.findProgramAddressSync(seeds6, programId);
if (pda6.toBase58() === expected) {
  console.log(`✓✓✓ FOUND IT! No counter needed`);
  process.exit(0);
}

// Test 7: Different seed string
console.log("7. Testing different seed strings...");
const prefixes = ["nft", "mint", "token", "discount", "voucher", "ticket"];
for (const prefix of prefixes) {
  for (let i = 0; i < 5; i++) {
    const seeds = [Buffer.from(prefix), promotionPDA.toBuffer(), u64ToBytes(i)];
    const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
    if (pda.toBase58() === expected) {
      console.log(`✓✓✓ FOUND IT! prefix = '${prefix}', counter = ${i}`);
      process.exit(0);
    }
  }
}

console.log("\n❌ NO MATCH FOUND");
console.log("\nThis means the program's seeds don't match any standard pattern.");
console.log("Check your Rust code's #[account] seeds constraint!");
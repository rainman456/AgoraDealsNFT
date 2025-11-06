import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkIDL() {
  console.log('🔍 Checking IDL file...\n');

  const idlPath = path.join(__dirname, '../idl/discount_platform.json');
  
  // Check if file exists
  if (!fs.existsSync(idlPath)) {
    console.error('❌ IDL file not found at:', idlPath);
    console.log('\n📋 Steps to fix:');
    console.log('1. Navigate to your contracts directory: cd ../contracts');
    console.log('2. Build the Anchor program: anchor build');
    console.log('3. Copy the IDL: cp target/idl/discount_platform.json ../backend/src/idl/');
    process.exit(1);
  }

  console.log('✅ IDL file exists at:', idlPath);

  try {
    const idlContent = fs.readFileSync(idlPath, 'utf-8');
    const idl = JSON.parse(idlContent);

    // Detect IDL format
    let idlFormat = 'unknown';
    let name, version, programId;

    // New format (Anchor 0.30+)
    if (idl.address && idl.metadata) {
      idlFormat = 'new (Anchor 0.30+)';
      name = idl.metadata.name;
      version = idl.metadata.version;
      programId = idl.address;
    } 
    // Old format (Anchor 0.29)
    else if (idl.name && idl.version) {
      idlFormat = 'old (Anchor 0.29)';
      name = idl.name;
      version = idl.version;
      programId = idl.metadata?.address;
    }

    console.log('\n📊 IDL Structure:');
    console.log('- Format:', idlFormat);
    console.log('- Name:', name || '❌ Missing');
    console.log('- Version:', version || '❌ Missing');
    console.log('- Program ID:', programId || '❌ Missing');
    console.log('- Instructions:', idl.instructions?.length || 0);
    console.log('- Accounts:', idl.accounts?.length || 0);
    console.log('- Types:', idl.types?.length || 0);
    console.log('- Errors:', idl.errors?.length || 0);

    // Check required fields
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!name) {
      issues.push('Missing program name');
    }
    if (!version) {
      issues.push('Missing version');
    }
    if (!idl.instructions || !Array.isArray(idl.instructions)) {
      issues.push('Missing or invalid "instructions" array');
    } else if (idl.instructions.length === 0) {
      warnings.push('No instructions defined in program');
    }
    if (!idl.accounts || !Array.isArray(idl.accounts)) {
      issues.push('Missing or invalid "accounts" array');
    } else if (idl.accounts.length === 0) {
      warnings.push('No accounts defined in program');
    }

    if (issues.length > 0) {
      console.log('\n❌ Critical Issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('\n📋 This usually means the Anchor program needs to be built properly.');
      console.log('Run: cd ../contracts && anchor build');
      process.exit(1);
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    console.log('\n✅ IDL structure is valid!');

    // Show program ID info
    if (programId) {
      console.log('\n🔑 Program ID:');
      console.log(`  ${programId}`);
      console.log('\n💡 Make sure this matches your .env file:');
      console.log(`  PROGRAM_ID=${programId}`);
    } else {
      console.log('\n⚠️  No program ID found in IDL. Add this to your .env:');
      console.log('  PROGRAM_ID=<your_program_id>');
    }

    // Show account types
    if (idl.accounts && idl.accounts.length > 0) {
      console.log('\n📦 Account Types:');
      idl.accounts.forEach((acc: any) => {
        const fieldCount = acc.type?.kind === 'struct' 
          ? acc.type.fields?.length || 0 
          : 0;
        console.log(`  - ${acc.name} (${fieldCount} fields)`);
      });
    }

    // Show instructions
    if (idl.instructions && idl.instructions.length > 0) {
      console.log('\n🔧 Instructions:');
      const displayCount = Math.min(10, idl.instructions.length);
      idl.instructions.slice(0, displayCount).forEach((instr: any) => {
        const argCount = instr.args?.length || 0;
        console.log(`  - ${instr.name} (${argCount} args)`);
      });
      if (idl.instructions.length > displayCount) {
        console.log(`  ... and ${idl.instructions.length - displayCount} more`);
      }
    }

    console.log('\n✨ IDL check passed! You can now run:');
    console.log('   npm run seed');

  } catch (error) {
    console.error('❌ Error reading or parsing IDL:', error);
    if (error instanceof SyntaxError) {
      console.log('\n📋 The IDL file contains invalid JSON. Try rebuilding:');
      console.log('cd ../contracts && anchor build');
    }
    process.exit(1);
  }
}

checkIDL();
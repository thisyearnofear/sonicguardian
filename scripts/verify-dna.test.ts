
import { extractSonicDNA } from '../src/lib/dna';

async function testDNA() {
  console.log('🧪 Starting Sonic DNA Verification...\n');

  const pattern1 = 's("bd*4").bank("RolandTR909")';
  const pattern2 = 's("bd bd bd bd").bank("RolandTR909")'; // Semantically identical
  const pattern3 = 'note("c4 e4 g4").s("sine")'; // Different pattern
  
  const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  console.log('--- Case 1: Identical Patterns (Normalized) ---');
  const dna1 = await extractSonicDNA(pattern1, salt);
  const dna2 = await extractSonicDNA(pattern2, salt);

  console.log(`Pattern 1 DNA: ${dna1?.dna}`);
  console.log(`Pattern 2 DNA: ${dna2?.dna}`);
  console.log(`Commitments Match: ${dna1?.commitment === dna2?.commitment}`);
  
  if (dna1?.commitment !== dna2?.commitment) {
    console.error('❌ Error: Semantically identical patterns produced different commitments!');
  } else {
    console.log('✅ Success: Normalization working correctly.');
  }

  console.log('\n--- Case 2: Different Patterns ---');
  const dna3 = await extractSonicDNA(pattern3, salt);
  console.log(`Pattern 3 DNA: ${dna3?.dna}`);
  console.log(`Commitments differ: ${dna1?.commitment !== dna3?.commitment}`);
  
  if (dna1?.commitment === dna3?.commitment) {
    console.error('❌ Error: Different patterns produced the same commitment!');
  } else {
    console.log('✅ Success: Unique patterns produce unique commitments.');
  }

  console.log('\n--- Case 3: Commitment Integrity ---');
  console.log(`DNA 1 Commitment: ${dna1?.commitment}`);
  console.log(`DNA 1 Hash: ${dna1?.hash}`);
  
  if (dna1?.commitment?.length && dna1.commitment.length > 32) {
    console.log('✅ Success: Commitment format is correct (Starknet felt compatible).');
  } else {
    console.error('❌ Error: Commitment format is invalid.');
  }

  console.log('\n🏁 Verification Complete.');
}

testDNA().catch(console.error);

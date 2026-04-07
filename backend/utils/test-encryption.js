const { encryptFile, decryptFile } = require('./encryptionUtils');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runTest() {
  const testKey = crypto.randomBytes(32).toString('hex');
  const wrongKey = crypto.randomBytes(32).toString('hex');
  const inputFile = 'test-input.txt';
  const encryptedFile = 'test-input.txt.enc';
  const decryptedFile = 'test-decrypted.txt';
  const testData = 'Lucy Class Backup Encryption Test Data ' + Date.now();

  console.log('--- Encryption Test Started ---');
  
  try {
    // 1. Setup
    fs.writeFileSync(inputFile, testData);
    console.log('1. Test file created.');

    // 2. Encrypt
    console.log('2. Encrypting...');
    await encryptFile(inputFile, encryptedFile, testKey);

    // 3. Verify encrypted file is different and has header
    const stats = fs.statSync(encryptedFile);
    console.log(`3. Encrypted file size: ${stats.size} bytes (Header: 32 bytes + Data)`);

    // 4. Decrypt with correct key
    console.log('4. Decrypting with correct key...');
    await decryptFile(encryptedFile, decryptedFile, testKey);

    // 5. Verify content
    const decryptedData = fs.readFileSync(decryptedFile, 'utf8');
    if (decryptedData === testData) {
      console.log('5. ✅ Content matches perfectly!');
    } else {
      throw new Error('5. ❌ Content mismatch!');
    }

    // 6. Test with WRONG key (GCM should catch this)
    console.log('6. Testing with WRONG key (expecting failure)...');
    try {
      await decryptFile(encryptedFile, 'wrong.txt', wrongKey);
      console.log('6. ❌ Error: Decryption with wrong key should have failed!');
    } catch (err) {
      console.log('6. ✅ Correctly failed with wrong key:', err.message);
    }

    // 7. Test with CORRUPTED data
    console.log('7. Testing with CORRUPTED data (expecting failure)...');
    const buff = fs.readFileSync(encryptedFile);
    buff[40] = buff[40] ^ 0xFF; // Flip a bit in the ciphertext
    fs.writeFileSync('corrupted.enc', buff);
    try {
      await decryptFile('corrupted.enc', 'corrupted.txt', testKey);
      console.log('7. ❌ Error: Decryption of corrupted data should have failed!');
    } catch (err) {
      console.log('7. ✅ Correctly failed on corrupted data:', err.message);
    }

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    // Cleanup
    const files = [inputFile, encryptedFile, decryptedFile, 'wrong.txt', 'corrupted.enc', 'corrupted.txt'];
    files.forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    console.log('--- Test Finished & Cleanup Done ---');
  }
}

runTest();

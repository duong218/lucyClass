const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream/promises');

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a file using AES-256-GCM
 * Format: [16 bytes IV][16 bytes AuthTag][encrypted data]
 * 
 * @param {string} inputPath - Path to the source file
 * @param {string} outputPath - Path to save the encrypted file
 * @param {string} hexKey - 64-character hex encryption key (32 bytes)
 */
async function encryptFile(inputPath, outputPath, hexKey) {
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('Encryption key must be a 64-character hex string (32 bytes)');
  }

  const key = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  // 1. Reserve 32 bytes for IV and AuthTag
  output.write(Buffer.alloc(IV_LENGTH + AUTH_TAG_LENGTH));

  // 2. Encrypt and pipe
  await pipeline(input, cipher, output);

  // 3. Get AuthTag
  const authTag = cipher.getAuthTag();

  // 4. Overwrite reserved header with real IV and AuthTag
  const fd = fs.openSync(outputPath, 'r+');
  fs.writeSync(fd, iv, 0, IV_LENGTH, 0);
  fs.writeSync(fd, authTag, 0, AUTH_TAG_LENGTH, IV_LENGTH);
  fs.closeSync(fd);

  console.log(`[Encryption] File encrypted successfully: ${outputPath}`);
}

/**
 * Decrypts a file using AES-256-GCM
 * 
 * @param {string} inputPath - Path to the encrypted file
 * @param {string} outputPath - Path to save the decrypted file
 * @param {string} hexKey - 64-character hex encryption key (32 bytes)
 */
async function decryptFile(inputPath, outputPath, hexKey) {
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('Encryption key must be a 64-character hex string (32 bytes)');
  }

  const key = Buffer.from(hexKey, 'hex');

  // 1. Read IV and AuthTag from the beginning of the file
  const fd = fs.openSync(inputPath, 'r');
  const iv = Buffer.alloc(IV_LENGTH);
  const authTag = Buffer.alloc(AUTH_TAG_LENGTH);

  fs.readSync(fd, iv, 0, IV_LENGTH, 0);
  fs.readSync(fd, authTag, 0, AUTH_TAG_LENGTH, IV_LENGTH);
  fs.closeSync(fd);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // 2. Decrypt and pipe (skipping the first 32 bytes)
  const input = fs.createReadStream(inputPath, { start: IV_LENGTH + AUTH_TAG_LENGTH });
  const output = fs.createWriteStream(outputPath);

  await pipeline(input, decipher, output);

  console.log(`[Decryption] File decrypted successfully: ${outputPath}`);
}

module.exports = {
  encryptFile,
  decryptFile
};

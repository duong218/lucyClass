const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

/**
 * Simple MongoDB Backup Script (mongodump)
 * Requirements: MongoDB Database Tools must be installed on the system.
 */

const BACKUP_PATH = process.env.BACKUP_PATH;

if (!BACKUP_PATH) {
  console.error('❌ Error: BACKUP_PATH not defined in .env');
  process.exit(1);
}

const BACKUP_DIR = path.resolve(BACKUP_PATH);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const fileName = `backup-${timestamp}`;
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

const command = `mongodump --uri="${uri}" --out="${path.join(BACKUP_DIR, fileName)}" --gzip`;

console.log(`Starting backup to ${fileName}...`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    return;
  }
  console.log(`Backup completed successfully at ${BACKUP_DIR}/${fileName}`);
});

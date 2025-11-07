import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);

class WORMStorage {
  constructor(baseDir) {
    this.baseDir = baseDir;
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  async write(data, metadata = {}) {
    const timestamp = new Date().toISOString();
    const hash = crypto.createHash('sha256');
    
    // Create immutable record with metadata
    const record = {
      timestamp,
      metadata,
      data,
      previousHash: await this.getLatestHash()
    };

    // Calculate new hash
    hash.update(JSON.stringify(record));
    const currentHash = hash.digest('hex');
    record.hash = currentHash;

    // Write to storage with hash as filename
    const filePath = path.join(this.baseDir, `${currentHash}.json`);
    await writeFile(filePath, JSON.stringify(record), 'utf8');
    
    // Update hash chain
    await this.updateHashChain(currentHash);
    
    return {
      hash: currentHash,
      timestamp,
      filePath
    };
  }

  async read(hash) {
    const filePath = path.join(this.baseDir, `${hash}.json`);
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  async verify(hash) {
    try {
      const record = await this.read(hash);
      const verifyHash = crypto.createHash('sha256');
      
      // Remove hash from verification
      const { hash: recordHash, ...recordWithoutHash } = record;
      verifyHash.update(JSON.stringify(recordWithoutHash));
      
      const calculatedHash = verifyHash.digest('hex');
      return calculatedHash === hash;
    } catch (err) {
      return false;
    }
  }

  async getLatestHash() {
    try {
      const chainPath = path.join(this.baseDir, 'chain.txt');
      if (!fs.existsSync(chainPath)) {
        return null;
      }
      const chain = await readFile(chainPath, 'utf8');
      const hashes = chain.trim().split('\n');
      return hashes[hashes.length - 1];
    } catch (err) {
      return null;
    }
  }

  async updateHashChain(hash) {
    const chainPath = path.join(this.baseDir, 'chain.txt');
    await appendFile(chainPath, `${hash}\n`, 'utf8');
  }

  async export(startDate, endDate) {
    const chainPath = path.join(this.baseDir, 'chain.txt');
    const chain = await readFile(chainPath, 'utf8');
    const hashes = chain.trim().split('\n');

    const records = await Promise.all(
      hashes.map(async hash => {
        const record = await this.read(hash);
        const recordDate = new Date(record.timestamp);
        if ((!startDate || recordDate >= startDate) && 
            (!endDate || recordDate <= endDate)) {
          return record;
        }
        return null;
      })
    );

    return records.filter(r => r !== null);
  }
}

export default WORMStorage;
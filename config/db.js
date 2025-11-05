const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('db.json not found, creating a new one...');
      const defaultData = { users: [], ratings: [] };
      await writeDB(defaultData);
      return defaultData;
    }
    console.error('Error reading db.json:', error);
    throw new Error('Could not read database');
  }
}

async function writeDB(data) {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
    throw new Error('Could not write to database');
  }
}

module.exports = { readDB, writeDB };


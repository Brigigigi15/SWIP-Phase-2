const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { loadServiceAccount } = require('./googleSheets');

// Cache of UAT Form folders to scan.
// This file is generated once (offline) so we don't have to
// discover all UAT Form folders on every refresh.
const CACHE_FILE = path.join(__dirname, 'uatFoldersCache.json');

let uatFoldersCache = [];

try {
  const raw = fs.readFileSync(CACHE_FILE, 'utf8');
  uatFoldersCache = JSON.parse(raw);
  console.log(`Loaded ${uatFoldersCache.length} cached UAT Form folders`);
} catch (err) {
  console.error('Failed to load cached UAT folders', err.message || err);
}

// Map for status keyed by BEIS School ID
let uatStatusByBeis = new Map();

function createDriveClient() {
  const serviceAccount = loadServiceAccount();
  const auth = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/drive.readonly']
  );
  return google.drive({ version: 'v3', auth });
}

// Simple concurrency helper
async function asyncPool(limit, items, fn) {
  const ret = [];
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(ret);
}

// Refresh UAT status by checking only the known UAT Form folders
async function refreshUatStatus() {
  uatStatusByBeis = new Map();

  if (!uatFoldersCache.length) {
    console.warn('No UAT folders in cache; skipping Drive scan');
    return uatStatusByBeis;
  }

  const drive = createDriveClient();
  const total = uatFoldersCache.length;
  let checked = 0;

  const enrichedFolders = [];

  await asyncPool(20, uatFoldersCache, async (folder) => {
    const parentFolderId = folder.parentId;
    if (!parentFolderId) return;

    let parentFolderName = '';
    let hasFiles = false;
    let beisId = '';

    try {
      // Get parent folder name (e.g. "School Name - 123456")
      const parentRes = await drive.files.get({
        fileId: parentFolderId,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      parentFolderName = parentRes.data.name || '';
    } catch (err) {
      console.error(
        `Failed to get parent folder name for ${parentFolderId}:`,
        err.message || err
      );
    }

    if (parentFolderName) {
      const match = parentFolderName.match(/-\s*([0-9A-Za-z]+)\s*$/);
      if (match) {
        beisId = match[1].trim();
      }
    }

    try {
      // Check UAT Form folder for files
      const res = await drive.files.list({
        q: `'${folder.id}' in parents and trashed = false`,
        fields: 'files(id)',
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      hasFiles = (res.data.files || []).length > 0;
    } catch (err) {
      console.error(
        `Failed to check UAT Form folder ${folder.id}:`,
        err.message || err
      );
    }

    enrichedFolders.push({
      uatFormFolderId: folder.id,
      parentFolderId,
      parentFolderName,
      hasFiles,
    });

    if (beisId) {
      uatStatusByBeis.set(beisId, {
        hasFiles,
        parentFolderName,
      });
    }

    checked += 1;
    if (checked % 50 === 0 || checked === total) {
      console.log(`UAT scan progress: ${checked}/${total}`);
    }
  });

  // Save enriched JSON for reference / debugging
  try {
    const outputFile = path.join(__dirname, 'uatFoldersCacheEnriched.json');
    fs.writeFileSync(
      outputFile,
      JSON.stringify(enrichedFolders, null, 2),
      'utf8'
    );
    console.log(
      `Enriched UAT folder metadata saved to ${outputFile} (BEIS entries: ${uatStatusByBeis.size})`
    );
  } catch (err) {
    console.error('Failed to write enriched UAT cache', err.message || err);
  }

  return uatStatusByBeis;
}

function getUatStatusByBeis() {
  return uatStatusByBeis;
}

module.exports = {
  refreshUatStatus,
  getUatStatusByBeis,
};


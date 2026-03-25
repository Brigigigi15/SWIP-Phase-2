const { google } = require('googleapis');
const { loadServiceAccount } = require('./googleSheets');

// Shared Drive ID for "iOne - DepED SWIP Project"
// Root URL: https://drive.google.com/drive/u/0/folders/0ACdnecR8WwXiUk9PVA
const SHARED_DRIVE_ID = '0ACdnecR8WwXiUk9PVA';

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

async function listAllUatFolders(drive) {
  const folders = [];
  let pageToken = undefined;

  do {
    const res = await drive.files.list({
      q: "name = 'UAT Form' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      // Use allDrives so the service account only needs
      // access to the shared folder/items, not full
      // shared drive membership.
      corpora: 'allDrives',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'nextPageToken, files(id, name, parents)',
      pageSize: 1000,
      pageToken
    });

    const batch = res.data.files || [];
    folders.push(...batch);
    pageToken = res.data.nextPageToken || null;
  } while (pageToken);

  return folders;
}

async function folderHasContent(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    corpora: 'allDrives',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    fields: 'files(id)',
    pageSize: 1
  });
  const files = res.data.files || [];
  return files.length > 0;
}

async function refreshUatStatus() {
  try {
    const drive = createDriveClient();

    // Find all "UAT Form" folders under the shared drive.
    const uatFolders = await listAllUatFolders(drive);

    const parentIdSet = new Set();
    for (const f of uatFolders) {
      const parents = f.parents || [];
      if (parents.length) {
        parentIdSet.add(parents[0]);
      }
    }

    const parentIdToBeis = new Map();
    for (const parentId of parentIdSet) {
      try {
        const res = await drive.files.get({
          fileId: parentId,
          fields: 'id, name',
          supportsAllDrives: true
        });
        const name = res.data.name || '';
        const match = name.match(/-\s*([0-9A-Za-z]+)\s*$/);
        if (match) {
          const beisId = match[1].trim();
          if (beisId) {
            parentIdToBeis.set(parentId, beisId);
          }
        }
      } catch (err) {
        // Ignore individual failures; continue with others.
        console.error('Failed to resolve school folder for parent', parentId, err.message || err);
      }
    }

    const nextMap = new Map();

    for (const folder of uatFolders) {
      const parents = folder.parents || [];
      if (!parents.length) continue;
      const parentId = parents[0];
      const beisId = parentIdToBeis.get(parentId);
      if (!beisId) continue;

      try {
        const hasContent = await folderHasContent(drive, folder.id);
        if (hasContent) {
          nextMap.set(beisId, { hasContent: true });
        } else if (!nextMap.has(beisId)) {
          nextMap.set(beisId, { hasContent: false });
        }
      } catch (err) {
        console.error('Failed to check contents for UAT folder', folder.id, err.message || err);
      }
    }

    uatStatusByBeis = nextMap;
    console.log('Refreshed UAT Form status for', uatStatusByBeis.size, 'schools');
  } catch (err) {
    console.error('Failed to refresh UAT status from Drive', err.message || err);
  }
}

function getUatStatusByBeis() {
  return uatStatusByBeis;
}

module.exports = {
  refreshUatStatus,
  getUatStatusByBeis
};

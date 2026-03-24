const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function loadServiceAccount() {
  let raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    raw = raw.trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    return JSON.parse(raw);
  }

  const jsonPath = path.join(__dirname, '..', '..', 'monitoring-dashboard-485505-73f943f6722d.json');
  const fileData = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(fileData);
}

function createSheetsClient() {
  const serviceAccount = loadServiceAccount();
  const auth = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    SCOPES
  );
  return google.sheets({ version: 'v4', auth });
}

module.exports = {
  createSheetsClient
};

